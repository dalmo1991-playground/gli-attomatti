import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAreaRiservataAuthenticated } from "@/app/actions/areaRiservataAuth";
import {
  getAllAbsences,
  rebuildSnapshot,
  addAbsence,
  deleteAbsence,
  getMemberAbsences,
  saveMemberAbsences
} from "@/lib/absences";

export const dynamic = "force-dynamic";

function revalidateAllAbsencePaths() {
  try {
    revalidatePath("/api/assenze");
    revalidatePath("/assenze");
    revalidatePath("/area-riservata");
    revalidatePath("/area-riservata/assenze");
    revalidatePath("/area-riservata/appuntamenti");
  } catch {}
}

/**
 * GET /api/assenze
 * Returns all recorded absences or single member's absences if ?member=... is provided.
 * Protected by Area Riservata session authentication.
 */
export async function GET(req: NextRequest) {
  try {
    if (!(await isAreaRiservataAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const member = url.searchParams.get("member");
    const bypassCache = url.searchParams.has("refresh") || url.searchParams.has("t");

    if (member) {
      const absences = await getMemberAbsences(member);
      return NextResponse.json({
        success: true,
        memberName: member,
        absences
      });
    }

    const forceRebuild = url.searchParams.has("rebuild");
    const data = forceRebuild
      ? await rebuildSnapshot()
      : await getAllAbsences(undefined, bypassCache);
    return NextResponse.json(
      {
        success: true,
        ...data
      },
      {
        headers: {
          "Cache-Control": "no-store, must-revalidate"
        }
      }
    );
  } catch (error: any) {
    console.error("[API Assenze GET Exception]", error);
    return NextResponse.json(
      { success: false, error: "Errore durante il recupero delle assenze: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/assenze
 * Batch saves the entire updated absences array for a single member in 1 write operation.
 * Protected by Area Riservata session authentication.
 * Body: { memberName: string, absences: AbsenceRecord[] }
 */
export async function PUT(req: NextRequest) {
  try {
    if (!(await isAreaRiservataAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { memberName, absences } = body || {};

    if (!memberName || typeof memberName !== "string" || !memberName.trim()) {
      return NextResponse.json(
        { success: false, error: "Il nome del membro è obbligatorio." },
        { status: 400 }
      );
    }

    if (!Array.isArray(absences)) {
      return NextResponse.json(
        { success: false, error: "L'elenco assenze deve essere un array." },
        { status: 400 }
      );
    }

    await saveMemberAbsences(memberName.trim(), absences);

    // Invalidate caches
    revalidateAllAbsencePaths();

    return NextResponse.json({
      success: true,
      memberName: memberName.trim(),
      count: absences.length
    });
  } catch (error: any) {
    console.error("[API Assenze PUT Exception]", error);
    return NextResponse.json(
      { success: false, error: "Errore durante il salvataggio: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/assenze
 * Registers a new absence.
 * Protected by Area Riservata session authentication.
 * Body: { memberName: string, startDate: string, endDate?: string, note?: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await isAreaRiservataAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { memberName, startDate, endDate, note } = body || {};

    if (!memberName || typeof memberName !== "string" || !memberName.trim()) {
      return NextResponse.json(
        { success: false, error: "Il nome del membro è obbligatorio." },
        { status: 400 }
      );
    }

    if (!startDate || typeof startDate !== "string") {
      return NextResponse.json(
        { success: false, error: "La data di inizio è obbligatoria." },
        { status: 400 }
      );
    }

    // Basic date validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      return NextResponse.json(
        { success: false, error: "Formato data non valido (richiesto AAAA-MM-GG)." },
        { status: 400 }
      );
    }

    const finalEndDate = endDate && dateRegex.test(endDate) ? endDate : startDate;
    if (finalEndDate < startDate) {
      return NextResponse.json(
        { success: false, error: "La data di fine non può essere precedente a quella di inizio." },
        { status: 400 }
      );
    }

    const record = await addAbsence({
      memberName: memberName.trim(),
      startDate,
      endDate: finalEndDate,
      note: typeof note === "string" ? note.trim() : undefined
    });

    revalidateAllAbsencePaths();

    return NextResponse.json({
      success: true,
      record
    });
  } catch (error: any) {
    console.error("[API Assenze POST Exception]", error);
    return NextResponse.json(
      { success: false, error: "Errore durante il salvataggio dell'assenza: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assenze
 * Protected by Area Riservata session authentication.
 * Query params or body: { id: string, memberName: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAreaRiservataAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Accesso non autorizzato. Autenticazione all'Area Riservata richiesta." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    let id = url.searchParams.get("id");
    let memberName = url.searchParams.get("memberName");

    if (!id || !memberName) {
      try {
        const body = await req.json();
        id = id || body?.id;
        memberName = memberName || body?.memberName;
      } catch {
        // Ignored if body is empty
      }
    }

    if (!id || !memberName) {
      return NextResponse.json(
        { success: false, error: "Parametri 'id' e 'memberName' obbligatori." },
        { status: 400 }
      );
    }

    const deleted = await deleteAbsence(id, memberName);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Assenza non trovata o già rimossa." },
        { status: 404 }
      );
    }

    revalidateAllAbsencePaths();

    return NextResponse.json({
      success: true,
      id
    });
  } catch (error: any) {
    console.error("[API Assenze DELETE Exception]", error);
    return NextResponse.json(
      { success: false, error: "Errore durante l'eliminazione dell'assenza: " + (error?.message || error) },
      { status: 500 }
    );
  }
}

