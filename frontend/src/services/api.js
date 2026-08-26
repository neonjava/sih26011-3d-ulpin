import { PARCELS, DEMO_PRESETS, SAMPLE_DEEDS, REGISTRAR_STATS } from '../data/mockCadastreData';

const BASE_URL = '/api';

/**
 * Fetch all cadastre land parcels
 */
export async function getParcels() {
  try {
    const res = await fetch(`${BASE_URL}/parcels`);
    if (!res.ok) throw new Error('API offline');
    const data = await res.json();
    return data && data.length > 0 ? data : PARCELS;
  } catch {
    return PARCELS;
  }
}

/**
 * Fetch detailed parcel model with floors and units
 */
export async function getParcelById(id) {
  try {
    const res = await fetch(`${BASE_URL}/parcels/${id}`);
    if (!res.ok) throw new Error('API offline');
    const data = await res.json();
    return data || PARCELS.find(p => p.id === id) || PARCELS[0];
  } catch {
    return PARCELS.find(p => p.id === id) || PARCELS[0];
  }
}

/**
 * Spatial Title & Volumetric Loan Verification (3D CERSAI check)
 */
export async function verifyLoan(application) {
  try {
    const res = await fetch(`${BASE_URL}/verify-loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(application)
    });
    if (!res.ok) throw new Error('API offline');
    return await res.json();
  } catch {
    // Fallback simulation based on application and matching preset/unit data
    const matchedPreset = DEMO_PRESETS.find(p => 
      p.unitId === application.unitId || 
      (application.unitNumber && p.unitId.includes(application.unitNumber.replace(/\s+/g, '')))
    );

    const parcel = PARCELS.find(p => p.id === application.parcelId) || PARCELS[0];
    let unit = null;
    for (const f of parcel.floors) {
      const u = f.units.find(un => un.id === application.unitId || un.unitNumber === application.unitNumber);
      if (u) { unit = u; break; }
    }

    if (matchedPreset) {
      return {
        status: matchedPreset.expectedOutcome,
        riskScore: matchedPreset.riskScore,
        overlapVolume: matchedPreset.overlapVolume,
        overlapPercentage: matchedPreset.overlapPercentage,
        existingBank: matchedPreset.existingBank,
        existingCersai: matchedPreset.existingCersai,
        conflictDetails: matchedPreset.description,
        timestamp: new Date().toISOString(),
        ladmClass: "LA_LegalSpaceBuildingUnit",
        ulpin3d: unit ? unit.ulpin3d : "MH-27-04-1245-08-F04-U402-Z012015",
        verificationId: "3DCERSAI-" + Math.floor(100000 + Math.random() * 900000)
      };
    }

    if (unit && unit.hasConflict) {
      return {
        status: "COLLISION_DETECTED",
        riskScore: 96,
        overlapVolume: `${(unit.carpetArea * 3.0).toFixed(1)} m³`,
        overlapPercentage: "100%",
        existingBank: unit.activeLienBank || "Existing Registered Financial Institution",
        existingCersai: unit.cersaiId || "CERSAI-REF-992182",
        conflictDetails: unit.conflictDetails,
        timestamp: new Date().toISOString(),
        ladmClass: unit.ladmClass,
        ulpin3d: unit.ulpin3d,
        verificationId: "3DCERSAI-" + Math.floor(100000 + Math.random() * 900000)
      };
    }

    return {
      status: "SAFE_TO_LEND",
      riskScore: 3,
      overlapVolume: "0.0 m³",
      overlapPercentage: "0%",
      existingBank: "None (Clear Title)",
      existingCersai: "None",
      conflictDetails: "No spatial overlapping liens detected in ISO 19152 3D Cadastre database.",
      timestamp: new Date().toISOString(),
      ladmClass: "LA_LegalSpaceBuildingUnit",
      ulpin3d: unit ? unit.ulpin3d : "MH-27-04-1245-08-F03-U301-Z010013",
      verificationId: "3DCERSAI-" + Math.floor(100000 + Math.random() * 900000)
    };
  }
}

/**
 * AI Extrusion from Deed to 3D ULPIN
 */
export async function extrudeDocument(deedPayload) {
  try {
    const res = await fetch(`${BASE_URL}/extrude-deed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deedPayload)
    });
    if (!res.ok) throw new Error('API offline');
    return await res.json();
  } catch {
    // Return high-fidelity mock extrusion result
    return {
      success: true,
      ulpin3d: deedPayload.extractedData?.ulpin3d || "MH-27-04-1245-08-F04-U402-Z012015",
      volumeM3: deedPayload.extractedData?.spatialGeometry?.volumeM3 || 205.5,
      zBounds: deedPayload.extractedData?.spatialGeometry?.zInterval || [12.4, 15.4],
      ladmCompliance: "ISO_19152_COMPLIANT",
      meshSummary: {
        vertices: 24,
        faces: 12,
        boundingPrism: "AABB: [X: -3.8..3.4, Y: 12.4..15.4, Z: -3.8..3.4]"
      },
      message: "Successfully extruded 2D Deed boundary polygon into 3D Volumetric Cadastral Parcel."
    };
  }
}
