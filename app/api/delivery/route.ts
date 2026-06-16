import { NextRequest, NextResponse } from "next/server";
import { generateCustomBlueprint, getRecommendedAutomations, AUTOMATION_LIBRARY } from "@/lib/delivery";
import { getLead } from "@/lib/db";

// GET /api/delivery/blueprints?business_type=dental
// Returns recommended automations for a business type
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessType = searchParams.get("business_type") as any;
  const leadId = searchParams.get("lead_id");

  if (leadId) {
    const lead = await getLead(leadId);
    const recommended = getRecommendedAutomations(lead.business_type);
    return NextResponse.json({
      business_type: lead.business_type,
      recommended_automations: recommended.map(key => ({
        key,
        ...AUTOMATION_LIBRARY[key],
        template: undefined, // don't expose full template in list
      })),
    });
  }

  if (businessType) {
    const recommended = getRecommendedAutomations(businessType);
    return NextResponse.json({ recommended_automations: recommended });
  }

  // Return full library catalog
  return NextResponse.json({
    total: Object.keys(AUTOMATION_LIBRARY).length,
    automations: Object.entries(AUTOMATION_LIBRARY).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description,
      applicable_to: value.applicable_to,
      credentials_needed: value.credentials_needed,
    })),
  });
}

// POST /api/delivery/blueprints
// Generate a customized Make.com blueprint for a specific client
export async function POST(req: NextRequest) {
  const { lead_id, automation_name, custom_requirements } = await req.json();

  const lead = await getLead(lead_id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const blueprint = await generateCustomBlueprint(
    lead.business_type,
    automation_name,
    {
      name: lead.business_name,
      city: lead.city,
      custom_requirements,
    }
  );

  return NextResponse.json({
    blueprint,
    download_ready: true,
    message: `Blueprint generated for ${lead.business_name}. Import the JSON into Make.com to deploy.`,
  });
}
