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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function getServerKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);

      if (parsed?.default) {
        return parsed.default;
      }
    } catch {
      // Fall through to friendly configuration error.
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
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Supabase JS v2 does NOT have auth.admin.getUserByEmail().
// We use the supported paginated listUsers() API instead.
async function findAuthUserByEmail(adminClient: any, email: string) {
  const target = email.trim().toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];

    const match = users.find(
      (candidate: any) =>
        candidate.email?.trim().toLowerCase() === target
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
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json(
        {
          error: "Missing authorization.",
        },
        401
      );
    }

    const accessToken = authHeader.replace(/^Bearer\s+/i, "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serverKey = getServerKey();

    if (!supabaseUrl || !serverKey) {
      return json(
        {
          error: "Supabase server configuration is missing.",
        },
        500
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serverKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return json(
        {
          error: "Your admin session is invalid or expired.",
        },
        401
      );
    }

    const body = await req.json();

    const {
      familyId,
      familyMemberId,
      email,
    } = body || {};

    if (!familyId || !familyMemberId || !email) {
      return json(
        {
          error:
            "Family, family member and email are required.",
        },
        400
      );
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const {
      data: family,
      error: familyError,
    } = await supabaseAdmin
      .from("families")
      .select("id, owner_id, name")
      .eq("id", familyId)
      .single();

    if (familyError || !family) {
      return json(
        {
          error: "We couldn't find that family.",
        },
        404
      );
    }

    // Only an Admin can send invitations.
    let isAdmin = family.owner_id === user.id;

    if (!isAdmin) {
      const {
        data: adminMember,
        error: adminMemberError,
      } = await supabaseAdmin
        .from("family_members")
        .select("id, role, user_id")
        .eq("family_id", familyId)
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminMemberError) {
        throw adminMemberError;
      }

      isAdmin = !!adminMember;
    }

    if (!isAdmin) {
      return json(
        {
          error:
            "Only a family admin can send invitations.",
        },
        403
      );
    }

    const {
      data: member,
      error: memberError,
    } = await supabaseAdmin
      .from("family_members")
      .select(
        "id, family_id, name, email, role, user_id, relation"
      )
      .eq("id", familyMemberId)
      .eq("family_id", familyId)
      .single();

    if (memberError || !member) {
      return json(
        {
          error:
            "We couldn't find this family member.",
        },
        404
      );
    }

    if (member.role !== "adult") {
      return json(
        {
          error:
            "Only adult members can receive login invitations.",
        },
        400
      );
    }

    if (member.user_id) {
      return json(
        {
          error:
            "This family member already has an active HealthHub login.",
          code: "ACCOUNT_ALREADY_LINKED",
        },
        409
      );
    }

    if (
      !member.email ||
      member.email.trim().toLowerCase() !== normalizedEmail
    ) {
      return json(
        {
          error:
            "The invitation email does not match this family profile.",
        },
        400
      );
    }

    // Check pending invitation BEFORE checking Auth.
    const {
      data: existingInvitation,
      error: existingInvitationError,
    } = await supabaseAdmin
      .from("family_invitations")
      .select("id, expires_at, accepted_at")
      .eq("family_member_id", familyMemberId)
      .is("accepted_at", null)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (existingInvitationError) {
      throw existingInvitationError;
    }

    if (existingInvitation) {
      if (
        new Date(existingInvitation.expires_at) >
        new Date()
      ) {
        return json(
          {
            error:
              "An invitation has already been sent to this member. Ask them to check their email.",
            code: "INVITATION_ALREADY_SENT",
          },
          409
        );
      }

      await supabaseAdmin
        .from("family_invitations")
        .delete()
        .eq("id", existingInvitation.id);
    }

    // IMPORTANT:
    // Supabase JS v2 does not provide getUserByEmail().
    // Use listUsers() instead.
    const existingAuthUser =
      await findAuthUserByEmail(
        supabaseAdmin,
        normalizedEmail
      );

    if (existingAuthUser) {
      const metadataMemberId =
        existingAuthUser.user_metadata
          ?.family_member_id ||
        existingAuthUser.app_metadata
          ?.family_member_id ||
        null;

      const isUnconfirmed =
        !existingAuthUser.email_confirmed_at;

      const belongsToThisMember =
        metadataMemberId &&
        metadataMemberId === familyMemberId;

      // Clean up only a stale unconfirmed invitation account
      // belonging to this exact family member.
      if (
        isUnconfirmed &&
        belongsToThisMember
      ) {
        const {
          error: deleteStaleUserError,
        } =
          await supabaseAdmin.auth.admin.deleteUser(
            existingAuthUser.id
          );

        if (deleteStaleUserError) {
          throw deleteStaleUserError;
        }
      } else {
        return json(
          {
            error:
              "This email already has a HealthHub account. Ask the member to sign in with that account instead of sending a new invitation.",
            code: "ACCOUNT_ALREADY_EXISTS",
          },
          409
        );
      }
    }

    const rawToken = crypto.randomUUID();

    const tokenHash =
      await hashToken(rawToken);

    const appUrl = (
      Deno.env.get("APP_URL") ||
      "http://localhost:5173"
    ).replace(/\/$/, "");

    const redirectTo =
      `${appUrl}/accept-invitation?token=${rawToken}`;

    const {
      data: invitation,
      error: invitationError,
    } = await supabaseAdmin
      .from("family_invitations")
      .insert({
        family_id: familyId,
        family_member_id: familyMemberId,
        member_name: member.name,
        member_relation: member.relation,
        email: normalizedEmail,
        role: "adult",
        token_hash: tokenHash,
        expires_at: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .select("id")
      .single();

    if (invitationError) {
      if (invitationError.code === "23505") {
        return json(
          {
            error:
              "An invitation has already been sent to this member. Ask them to check their email.",
            code: "INVITATION_ALREADY_SENT",
          },
          409
        );
      }

      throw invitationError;
    }

    const {
      data: invitedUser,
      error: inviteError,
    } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(
        normalizedEmail,
        {
          data: {
            family_id: familyId,
            family_member_id: familyMemberId,
            family_name: family.name,
            name: member.name,
            relation: member.relation,
            role: "adult",
          },
          redirectTo,
        }
      );

    if (inviteError) {
      // Roll back invitation row.
      await supabaseAdmin
        .from("family_invitations")
        .delete()
        .eq("id", invitation.id);

      // Remove Auth user created by failed invitation.
      if (invitedUser?.user?.id) {
        await supabaseAdmin.auth.admin.deleteUser(
          invitedUser.user.id
        );
      }

      return json(
        {
          error:
            "We couldn't send the invitation right now. No family profile was changed. Please try again.",
          code: "INVITATION_SEND_FAILED",
        },
        502
      );
    }

    return json({
      success: true,
      message:
        "Invitation sent successfully.",
      invitationId: invitation.id,
      userId:
        invitedUser.user?.id ?? null,
    });
  } catch (error) {
    console.error(
      "invite-family-member error:",
      error
    );

    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to send the invitation.",
      },
      500
    );
  }
});