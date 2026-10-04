import { NextRequest } from "next/server";
import { getContent } from "@/lib/data";
import { renderEmailHtml, resolveEmailTheme, EmailTemplateConfig } from "@/lib/email/template";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const templateId = url.searchParams.get("template") || url.searchParams.get("id");
    const themeQuery = url.searchParams.get("theme");

    const content = await getContent();
    const emailsConfig = content?.emails || {};
    const settings = emailsConfig.settings || {};
    const templates: EmailTemplateConfig[] = Array.isArray(emailsConfig.templates) ? emailsConfig.templates : [];

    const selectedTemplate =
      templates.find((t) => t.id === templateId || t.name?.toLowerCase() === templateId?.toLowerCase()) ||
      templates[0];

    if (!selectedTemplate) {
      return new Response("<h1>Template email non trovato</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const chosenTheme = themeQuery || selectedTemplate.theme || "default";
    const themeColors = resolveEmailTheme(chosenTheme, content?.landings || [], selectedTemplate.customColors);

    const variables: Record<string, string> = {
      name: "Mario Rossi",
      nome: "Mario Rossi",
      email: "mario.rossi@example.com",
      event_title: "Le vacanze di Monsieur Hulot",
      titolo: "Le vacanze di Monsieur Hulot",
      event_date: "14 Novembre 2026",
      data: "14 Novembre 2026",
      event_location: "Kulturhaus Helferei, Zurigo",
      event_url: "https://gliattomatti.ch/Registrazioni/14-11-26",
      form_name: "Prenotazione Cineforum"
    };

    const html = renderEmailHtml({
      template: selectedTemplate,
      variables,
      themeColors,
      settings
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
