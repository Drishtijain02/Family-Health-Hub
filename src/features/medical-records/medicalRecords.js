import { supabase } from '../../lib/supabase'

const BUCKET_NAME = 'medical-records'
const SIGNED_URL_TTL_SECONDS = 60 * 5

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png'])

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
])

const RECORD_COLUMNS = [
  'id',
  'family_member_id',
  'title',
  'record_type',
  'category',
  'record_date',
  'file_url',
  'description',
  'created_at',
].join(', ')

export class MedicalRecordServiceError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'MedicalRecordServiceError'
    this.code = code
    this.details = details
  }
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new MedicalRecordServiceError(
      'VALIDATION_ERROR',
      `${fieldName} is required.`,
    )
  }

  return value.trim()
}

function getExtension(fileName) {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

function validateMedicalFile(file) {
  if (!file || typeof file.name !== 'string') {
    throw new MedicalRecordServiceError(
      'VALIDATION_ERROR',
      'Choose a medical report to upload.',
    )
  }

  const extension = getExtension(file.name)
  const hasSupportedExtension = ACCEPTED_EXTENSIONS.has(extension)
  const hasSupportedType =
    !file.type || ACCEPTED_MIME_TYPES.has(file.type)

  if (!hasSupportedExtension || !hasSupportedType) {
    throw new MedicalRecordServiceError(
      'UNSUPPORTED_FILE_TYPE',
      'Only PDF, JPG, JPEG, and PNG files can be uploaded.',
    )
  }
}

function createUniqueFileName(fileName) {
  const extension = getExtension(fileName)

  const safeBaseName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  return `${safeBaseName || 'medical-report'}-${crypto.randomUUID()}.${extension}`
}

function optionalText(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null
}

function getSupabaseMessage(error, fallback) {
  return error?.message || fallback
}

function validateStoragePath(filePath) {
  const path = requireNonEmptyString(filePath, 'Storage file path')

  if (
    path.startsWith('http') ||
    path.startsWith(`${BUCKET_NAME}/`)
  ) {
    throw new MedicalRecordServiceError(
      'INVALID_STORAGE_PATH',
      'Use the private object path within the medical-records bucket.',
    )
  }

  return path
}

/*
 * Fetch all medical records for one family member.
 *
 * IMPORTANT:
 * Every report is filtered using family_member_id.
 * This keeps each member's medical records separate.
 */
export async function fetchMedicalRecords(memberId) {
  const validMemberId = requireNonEmptyString(
    memberId,
    'Family member ID',
  )

  const { data, error } = await supabase
    .from('medical_records')
    .select(RECORD_COLUMNS)
    .eq('family_member_id', validMemberId)
    .order('record_date', {
      ascending: false,
      nullsFirst: false,
    })
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new MedicalRecordServiceError(
      'FETCH_FAILED',
      getSupabaseMessage(
        error,
        'Unable to load medical reports.',
      ),
      { cause: error },
    )
  }

  return data || []
}

/*
 * Upload a new medical record.
 */
export async function uploadMedicalRecord({
  familyMemberId,
  file,
  title,
  recordType,
  category,
  recordDate,
  description,
}) {
  const validMemberId = requireNonEmptyString(
    familyMemberId,
    'Family member ID',
  )

  const validTitle = requireNonEmptyString(
    title,
    'Report title',
  )

  validateMedicalFile(file)

  const fileName = createUniqueFileName(file.name)

  const storagePath = `${validMemberId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (uploadError) {
    throw new MedicalRecordServiceError(
      'UPLOAD_FAILED',
      getSupabaseMessage(
        uploadError,
        'Unable to upload the medical report.',
      ),
      { cause: uploadError },
    )
  }

  const { data, error: insertError } = await supabase
    .from('medical_records')
    .insert({
      family_member_id: validMemberId,
      title: validTitle,
      record_type: optionalText(recordType),
      category: optionalText(category),
      record_date: recordDate || null,
      file_url: storagePath,
      description: optionalText(description),
    })
    .select(RECORD_COLUMNS)
    .single()

  if (insertError) {
    /*
     * If database insert fails after Storage upload,
     * remove the uploaded file so we don't leave
     * an orphaned Storage object.
     */
    await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    throw new MedicalRecordServiceError(
      'SAVE_FAILED',
      getSupabaseMessage(
        insertError,
        'Unable to save the medical report.',
      ),
      { cause: insertError },
    )
  }

  return data
}

/*
 * NEW:
 * Update the editable information of an existing report.
 *
 * The actual medical file is NOT replaced here.
 * Only metadata such as:
 * - title
 * - record type
 * - category
 * - record date
 * - description
 *
 * is changed.
 */
export async function updateMedicalRecord({
  id,
  familyMemberId,
  title,
  recordType,
  category,
  recordDate,
  description,
}) {
  const validId = requireNonEmptyString(
    id,
    'Medical record ID',
  )

  const validMemberId = requireNonEmptyString(
    familyMemberId,
    'Family member ID',
  )

  const validTitle = requireNonEmptyString(
    title,
    'Report title',
  )

  const updates = {
    title: validTitle,
    record_type: optionalText(recordType),
    category: optionalText(category),
    record_date: recordDate || null,
    description: optionalText(description),
  }

  const { data, error } = await supabase
    .from('medical_records')
    .update(updates)
    .eq('id', validId)
    .eq('family_member_id', validMemberId)
    .select(RECORD_COLUMNS)
    .single()

  if (error) {
    throw new MedicalRecordServiceError(
      'UPDATE_FAILED',
      getSupabaseMessage(
        error,
        'Unable to update the medical report.',
      ),
      { cause: error },
    )
  }

  return data
}

/*
 * Get a temporary signed URL for a private medical report.
 */
export async function getMedicalRecordSignedUrl(filePath) {
  const validPath = validateStoragePath(filePath)

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(
      validPath,
      SIGNED_URL_TTL_SECONDS,
    )

  if (error || !data?.signedUrl) {
    throw new MedicalRecordServiceError(
      'SIGNED_URL_FAILED',
      getSupabaseMessage(
        error,
        'Unable to open this medical report.',
      ),
      { cause: error },
    )
  }

  return data.signedUrl
}

/*
 * Delete both:
 * 1. the private Storage file
 * 2. the database record
 */
export async function deleteMedicalRecord(record) {
  if (!record?.id) {
    throw new MedicalRecordServiceError(
      'VALIDATION_ERROR',
      'Medical record ID is required.',
    )
  }

  const storagePath = record.file_url
    ? validateStoragePath(record.file_url)
    : null

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (storageError) {
      throw new MedicalRecordServiceError(
        'DELETE_FILE_FAILED',
        getSupabaseMessage(
          storageError,
          'Unable to delete the medical report file.',
        ),
        { cause: storageError },
      )
    }
  }

  let query = supabase
    .from('medical_records')
    .delete()
    .eq('id', record.id)

  /*
   * If the record contains family_member_id,
   * include it in the delete condition as an extra
   * ownership/context safety check.
   */
  if (record.family_member_id) {
    query = query.eq(
      'family_member_id',
      record.family_member_id,
    )
  }

  const { error: deleteError } = await query

  if (deleteError) {
    throw new MedicalRecordServiceError(
      'DELETE_RECORD_FAILED',
      getSupabaseMessage(
        deleteError,
        'Unable to delete the medical report.',
      ),
      { cause: deleteError },
    )
  }

  return true
}