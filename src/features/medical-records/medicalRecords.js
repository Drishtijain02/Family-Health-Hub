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
  const hasSupportedType = !file.type || ACCEPTED_MIME_TYPES.has(file.type)

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
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getSupabaseMessage(error, fallback) {
  return error?.message || fallback
}

function validateStoragePath(filePath) {
  const path = requireNonEmptyString(filePath, 'Storage file path')

  if (path.startsWith('http') || path.startsWith(`${BUCKET_NAME}/`)) {
    throw new MedicalRecordServiceError(
      'INVALID_STORAGE_PATH',
      'Use the private object path within the medical-records bucket.',
    )
  }

  return path
}

/**
 * Returns records belonging only to the supplied family member.
 */
export async function fetchMedicalRecords(familyMemberId) {
  const memberId = requireNonEmptyString(familyMemberId, 'Family member ID')
  const { data, error } = await supabase
    .from('medical_records')
    .select(RECORD_COLUMNS)
    .eq('family_member_id', memberId)
    .order('record_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new MedicalRecordServiceError(
      'RECORD_FETCH_FAILED',
      getSupabaseMessage(error, 'Unable to load medical records.'),
    )
  }

  return data || []
}

/**
 * Uploads a private object, then creates its matching medical_records row.
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
  const memberId = requireNonEmptyString(familyMemberId, 'Family member ID')
  const recordTitle = requireNonEmptyString(title, 'Report title')
  validateMedicalFile(file)

  // This is the object path inside the medical-records bucket, not a public URL.
  const storagePath = `${memberId}/${createUniqueFileName(file.name)}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    })

  if (uploadError) {
    throw new MedicalRecordServiceError(
      'STORAGE_UPLOAD_FAILED',
      getSupabaseMessage(uploadError, 'Unable to upload this medical report.'),
    )
  }

  const insertObject = {
    family_member_id: memberId,
    title: recordTitle,
    record_type: optionalText(recordType),
    category: optionalText(category),
    record_date: optionalText(recordDate),
    file_url: storagePath,
    description: optionalText(description),
  }

  const { data, error: insertError } = await supabase
    .from('medical_records')
    .insert(insertObject)
    .select(RECORD_COLUMNS)
    .single()

  if (insertError) {
    const { error: cleanupError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath])

    if (cleanupError) {
      throw new MedicalRecordServiceError(
        'DATABASE_INSERT_FAILED_WITH_ORPHANED_FILE',
        'The report file uploaded, but its record could not be saved. File cleanup also failed; the upload is not complete.',
        { storagePath, cleanupError: getSupabaseMessage(cleanupError, 'Storage cleanup failed.') },
      )
    }

    throw new MedicalRecordServiceError(
      'DATABASE_INSERT_FAILED_CLEANED_UP',
      'The report could not be saved. The uploaded file was cleaned up.',
      { storagePath },
    )
  }

  return { record: data, storagePath }
}

/**
 * Creates a temporary URL for a private report. The bucket is never made public.
 */
export async function getMedicalRecordSignedUrl(filePath) {
  const storagePath = validateStoragePath(filePath)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new MedicalRecordServiceError(
      'SIGNED_URL_FAILED',
      getSupabaseMessage(error, 'Unable to open this medical report.'),
    )
  }

  return data.signedUrl
}

/**
 * Deletes an owner-authorized private Storage object before its database row.
 * This order avoids removing the record while its file remains accessible.
 */
export async function deleteMedicalRecord(record) {
  if (!record?.id) {
    throw new MedicalRecordServiceError('VALIDATION_ERROR', 'Medical record ID is required.')
  }

  const storagePath = validateStoragePath(record.file_url)
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (storageError) {
    throw new MedicalRecordServiceError(
      'STORAGE_DELETE_FAILED',
      getSupabaseMessage(storageError, 'Unable to remove the report file. The record was not deleted.'),
      { recordId: record.id, storagePath },
    )
  }

  const { data, error: databaseError } = await supabase
    .from('medical_records')
    .delete()
    .eq('id', record.id)
    .select('id')
    .maybeSingle()

  if (databaseError || !data) {
    throw new MedicalRecordServiceError(
      'STORAGE_DELETED_DATABASE_DELETE_FAILED',
      'The report file was removed, but the database record could not be deleted.',
      {
        recordId: record.id,
        storagePath,
        databaseError: getSupabaseMessage(databaseError, 'No matching record was deleted.'),
      },
    )
  }

  return { recordId: data.id, storagePath }
}
