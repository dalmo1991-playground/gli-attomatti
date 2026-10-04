import { NextRequest } from "next/server";
import { getContent } from "@/lib/data";
import { renderEmailHtml, resolveEmailTheme, EmailTemplateConfig } from "@/lib/email/template";
import { flattenJsonToDotNotation } from "@/lib/email/jsonPath";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    let rawTemplateParam = (url.searchParams.get("template") || url.searchParams.get("id") || "").trim();
    let subcaseId = (url.searchParams.get("subcase") || url.searchParams.get("subcase_id") || "").trim();
    const themeQuery = url.searchParams.get("theme");

    rawTemplateParam = rawTemplateParam.replace(/^#?email:/i, "").trim();
    if (rawTemplateParam.includes(":")) {
      const parts = rawTemplateParam.split(":");
      rawTemplateParam = parts[0]?.trim();
      if (!subcaseId) {
        subcaseId = parts[1]?.trim();
      }
    }

    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const settings = emailsConfig.settings || {};
    const templates: EmailTemplateConfig[] = Array.isArray(emailsConfig.templates) ? emailsConfig.templates : [];

    const selectedTemplate =
      templates.find((t) => t.id === rawTemplateParam || t.name?.toLowerCase() === rawTemplateParam.toLowerCase()) ||
      templates[0];

    if (!selectedTemplate) {
      return new Response("<h1>Template email non trovato</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // Resolve subcase if requested
    const activeSubcase = subcaseId && Array.isArray(selectedTemplate.subcases)
      ? selectedTemplate.subcases.find(
          (s) => s.id?.toLowerCase() === subcaseId.toLowerCase() || s.name?.toLowerCase() === subcaseId.toLowerCase()
        )
      : undefined;

    const chosenTheme = themeQuery || selectedTemplate.theme || "default";
    const themeColors = resolveEmailTheme(chosenTheme, content?.landings || [], selectedTemplate.customColors);

    let rawJsonObj: any = undefined;
    if (selectedTemplate.field_mapping?.sample_payload_json) {
      try {
        rawJsonObj = JSON.parse(selectedTemplate.field_mapping.sample_payload_json);
      } catch {}
    }

    const flattenedSample = rawJsonObj ? flattenJsonToDotNotation(rawJsonObj) : {};

    const variables: Record<string, string> = {
      ...flattenedSample,
      ...(activeSubcase?.custom_fields || {})
    };

    const baseUrl =
      req.nextUrl?.origin && !req.nextUrl.origin.includes("localhost")
        ? req.nextUrl.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || "https://gliattomatti.ch");

    const html = renderEmailHtml({
      template: selectedTemplate,
      variables,
      rawJsonObj,
      themeColors,
      settings,
      baseUrl
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (error: any) {
    return new Response(`<h1>Errore anteprima email</h1><pre>${error?.message || error}</pre>`, {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
}
