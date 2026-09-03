import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

function getServerKey() {
  const legacyKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  if (legacyKey) {
    return legacyKey;
  }

  const secretKeys = Deno.env.get(
    "SUPABASE_SECRET_KEYS"
  );

  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);

      if (parsed?.default) {
        return parsed.default;
      }
    } catch {
      // Fall through to configuration error.
    }
  }

  return null;
}

async function hashToken(token: string) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(buffer))
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}

// Supabase JS v2 does NOT have auth.admin.getUserByEmail().
// Use the supported paginated listUsers() API.
async function findAuthUserByEmail(
  adminClient: any,
  email: string
) {
  const target = email
    .trim()
    .toLowerCase();

  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const {
      data,
      error,
    } =
      await adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

    if (error) {
      throw error;
    }

    const users = data?.users || [];

    const match = users.find(
      (candidate: any) =>
        candidate.email
          ?.trim()
          .toLowerCase() === target
    );

    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return json(
      {
        error: "Method not allowed.",
      },
      405
    );
  }

  try {
    const body = await req.json();

    const action = body?.action;

    const invitationToken =
      String(body?.token || "").trim();

    const password =
      typeof body?.password === "string"
        ? body.password
        : "";

    if (!invitationToken) {
      return json(
        {
          error:
            "Invitation token is required.",
        },
        400
      );
    }

    if (
      action !== "details" &&
      action !== "accept"
    ) {
      return json(
        {
          error:
            "Invalid invitation action.",
        },
        400
      );
    }

    if (
      action === "accept" &&
      password.length < 6
    ) {
      return json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        400
      );
    }

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serverKey = getServerKey();

    if (!supabaseUrl || !serverKey) {
      return json(
        {
          error:
            "Supabase server configuration is missing.",
        },
        500
      );
    }

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serverKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    const tokenHash =
      await hashToken(invitationToken);

    const {
      data: invitation,
      error: invitationError,
    } =
      await supabaseAdmin
        .from("family_invitations")
        .select(
          "id, family_id, family_member_id, member_name, member_relation, email, role, expires_at, accepted_at"
        )
        .eq(
          "token_hash",
          tokenHash
        )
        .maybeSingle();

    if (invitationError) {
      throw invitationError;
    }

    if (!invitation) {
      return json(
        {
          error:
            "This invitation is invalid or no longer available.",
        },
        404
      );
    }

    if (invitation.accepted_at) {
      return json(
        {
          error:
            "This invitation has already been accepted.",
        },
        409
      );
    }

    if (
      new Date(invitation.expires_at) <=
      new Date()
    ) {
      return json(
        {
          error:
            "This invitation has expired. Please ask the family admin for a new one.",
        },
        410
      );
    }

    const {
      data: family,
      error: familyError,
    } =
      await supabaseAdmin
        .from("families")
        .select("id, name")
        .eq(
          "id",
          invitation.family_id
        )
        .single();

    if (familyError || !family) {
      return json(
        {
          error:
            "The invited family could not be found.",
        },
        404
      );
    }

    // DETAILS
    if (action === "details") {
      return json({
        success: true,
        familyName: family.name,
        name: invitation.member_name,
        relation:
          invitation.member_relation,
        role: invitation.role,
        email: invitation.email,
      });
    }

    // ACCEPTANCE IS TOKEN BASED.
    // No browser Supabase session is required.
    const invitedEmail =
      invitation.email
        .trim()
        .toLowerCase();

    const invitedUser =
      await findAuthUserByEmail(
        supabaseAdmin,
        invitedEmail
      );

    if (!invitedUser) {
      return json(
        {
          error:
            "We couldn't find the invited account. Please ask the family admin to send a new invitation.",
        },
        404
      );
    }

    const metadataMemberId =
      invitedUser.user_metadata
        ?.family_member_id ||
      invitedUser.app_metadata
        ?.family_member_id ||
      null;

    if (
      metadataMemberId &&
      invitation.family_member_id &&
      metadataMemberId !==
        invitation.family_member_id
    ) {
      return json(
        {
          error:
            "This invitation does not match the invited family profile.",
        },
        403
      );
    }

    // Set password and confirm email.
    const {
      error: passwordError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        invitedUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...(invitedUser.user_metadata ||
              {}),
            family_id:
              invitation.family_id,
            family_member_id:
              invitation.family_member_id,
            family_name:
              family.name,
            name:
              invitation.member_name,
            relation:
              invitation.member_relation,
            role:
              invitation.role ||
              "adult",
          },
        }
      );

    if (passwordError) {
      return json(
        {
          error:
            passwordError.message ||
            "We couldn't create your password. Please try again.",
        },
        400
      );
    }

    let memberId =
      invitation.family_member_id;

    // Normal new invitation flow.
    if (memberId) {
      const {
        data: pendingMember,
        error: pendingMemberError,
      } =
        await supabaseAdmin
          .from("family_members")
          .select(
            "id, family_id, name, relation, role, email, user_id"
          )
          .eq("id", memberId)
          .eq(
            "family_id",
            invitation.family_id
          )
          .single();

      if (
        pendingMemberError ||
        !pendingMember
      ) {
        return json(
          {
            error:
              "The family profile for this invitation could not be found.",
          },
          404
        );
      }

      if (
        pendingMember.user_id &&
        pendingMember.user_id !==
          invitedUser.id
      ) {
        return json(
          {
            error:
              "This family profile is already linked to another account.",
          },
          409
        );
      }

      if (
        !pendingMember.email ||
        pendingMember.email
          .trim()
          .toLowerCase() !==
          invitedEmail
      ) {
        return json(
          {
            error:
              "The invitation email does not match the family profile.",
          },
          409
        );
      }

      const {
        data: linkedMember,
        error: linkError,
      } =
        await supabaseAdmin
          .from("family_members")
          .update({
            user_id:
              invitedUser.id,
            role: "adult",
          })
          .eq(
            "id",
            pendingMember.id
          )
          .eq(
            "family_id",
            invitation.family_id
          )
          .is(
            "user_id",
            null
          )
          .select(
            "id, family_id, name, relation, role, user_id, email"
          )
          .single();

      if (linkError) {
        throw linkError;
      }

      memberId =
        linkedMember.id;
    } else {
      // Backward compatibility for old invitations.
      const {
        data: existingMember,
      } =
        await supabaseAdmin
          .from("family_members")
          .select(
            "id, user_id"
          )
          .eq(
            "family_id",
            invitation.family_id
          )
          .ilike(
            "email",
            invitedEmail
          )
          .maybeSingle();

      if (existingMember) {
        if (
          existingMember.user_id &&
          existingMember.user_id !==
            invitedUser.id
        ) {
          return json(
            {
              error:
                "This email is already linked to another family account.",
            },
            409
          );
        }

        const {
          error: updateError,
        } =
          await supabaseAdmin
            .from("family_members")
            .update({
              user_id:
                invitedUser.id,
              role: "adult",
            })
            .eq(
              "id",
              existingMember.id
            );

        if (updateError) {
          throw updateError;
        }

        memberId =
          existingMember.id;
      } else {
        const {
          data: newMember,
          error:
            memberInsertError,
        } =
          await supabaseAdmin
            .from("family_members")
            .insert({
              family_id:
                invitation.family_id,
              name:
                invitation.member_name,
              relation:
                invitation.member_relation,
              role:
                invitation.role ||
                "adult",
              email:
                invitedEmail,
              user_id:
                invitedUser.id,
            })
            .select("id")
            .single();

        if (memberInsertError) {
          throw memberInsertError;
        }

        memberId =
          newMember.id;
      }
    }

    // Mark invitation as accepted.
    const {
      error: acceptedError,
    } =
      await supabaseAdmin
        .from("family_invitations")
        .update({
          family_member_id:
            memberId,
          accepted_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          invitation.id
        )
        .is(
          "accepted_at",
          null
        );

    if (acceptedError) {
      throw acceptedError;
    }

    return json({
      success: true,
      message:
        "Invitation accepted successfully.",
      familyId:
        invitation.family_id,
      familyMemberId:
        memberId,
      email:
        invitedEmail,
    });
  } catch (error) {
    console.error(
      "accept-family-invitation error:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete the invitation.",
      },
      500
    );
  }
});