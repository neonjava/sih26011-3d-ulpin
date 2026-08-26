// SIH26011 - 3D ULPIN & Vertical Cadastre Master Mock Data
// Conforms to ISO 19152 LADM (Land Administration Domain Model) 3D Profile & Indian Cadastral Standards

export const PARCELS = [
  {
    id: "MH-MUM-BND-1245-08",
    name: "Shanti Heights Co-op Housing Society",
    city: "Mumbai",
    state: "Maharashtra",
    district: "Mumbai Suburban",
    sro: "Bandra SRO-4",
    villageCTS: "Bandra Village CTS No. 1245/8",
    surveyNumber: "1245/8",
    zone: "R-3 High Density Residential Zone (MMRDA)",
    parcelAreaSqM: 1850.0,
    coordinates: { lat: 19.0596, lng: 72.8295 },
    sanctionedMaxHeight: 38.0, // Max height in meters
    sanctionedFloors: 12,
    actualFloors: 14, // 2 Phantom illegal floors (13, 14)
    basementLevels: 2,
    totalUnits: 56,
    activeDisputes: 2,
    subsurfaceMetro: {
      name: "Mumbai Metro Line 3 (Aqua Line Underground)",
      depthMin: -18.0,
      depthMax: -12.0,
      bufferRadius: 15.0,
      status: "Protected Easement Zone - No Piling Permitted"
    },
    airRights: {
      elevationMin: 38.0,
      elevationMax: 60.0,
      purpose: "Civil Aviation Funnel Clearance & Leased Telecom 5G Corridor",
      status: "Restricted Air Space"
    },
    floors: [
      {
        floorNumber: -2,
        name: "Basement Level 2 (B2)",
        zMin: -6.0,
        zMax: -3.0,
        height: 3.0,
        type: "Subsurface Parking",
        units: [
          {
            id: "MH-MUM-BND-1245-08-B2-P01",
            ulpin3d: "MH-27-04-1245-08-B2-P01-Z-060-030",
            unitNumber: "Bay B2-01 to B2-06",
            floorNumber: -2,
            type: "Stacker 4W Parking",
            carpetArea: 75.0,
            builtUpArea: 90.0,
            zMin: -6.0,
            zMax: -3.0,
            ownerName: "Society Common Facility",
            status: "CLEAR",
            hasConflict: false,
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: null,
            position: { x: -4, z: -4, width: 8, depth: 8 }
          },
          {
            id: "MH-MUM-BND-1245-08-B2-P12",
            ulpin3d: "MH-27-04-1245-08-B2-P12-Z-060-030",
            unitNumber: "Bay B2-12 (Assigned Slot)",
            floorNumber: -2,
            type: "Private Parking Bay",
            carpetArea: 15.0,
            builtUpArea: 18.0,
            zMin: -6.0,
            zMax: -3.0,
            ownerName: "Vikramaditya Sharma",
            status: "ENCUMBERED",
            hasConflict: true,
            conflictType: "PARKING_CLASH",
            conflictDetails: "Double allocated in deed addendum to Flat 402 and Flat 901",
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: "SBI-MUM-2024-884912",
            position: { x: 4, z: 4, width: 6, depth: 6 }
          }
        ]
      },
      {
        floorNumber: -1,
        name: "Basement Level 1 (B1)",
        zMin: -3.0,
        zMax: 0.0,
        height: 3.0,
        type: "Subsurface Utility & Visitor Parking",
        units: [
          {
            id: "MH-MUM-BND-1245-08-B1-U01",
            ulpin3d: "MH-27-04-1245-08-B1-U01-Z-030000",
            unitNumber: "B1 Electrical Substation & STP",
            floorNumber: -1,
            type: "Utility Space",
            carpetArea: 120.0,
            builtUpArea: 140.0,
            zMin: -3.0,
            zMax: 0.0,
            ownerName: "Brihanmumbai Electric Supply (BEST)",
            status: "CLEAR",
            hasConflict: false,
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: null,
            position: { x: 0, z: 0, width: 14, depth: 14 }
          }
        ]
      },
      {
        floorNumber: 0,
        name: "Ground Floor (Podium & Lobby)",
        zMin: 0.0,
        zMax: 4.0,
        height: 4.0,
        type: "Commercial & Entrance Lobby",
        units: [
          {
            id: "MH-MUM-BND-1245-08-G-G01",
            ulpin3d: "MH-27-04-1245-08-G-G01-Z000004",
            unitNumber: "Shop G-01 (Pharmacy)",
            floorNumber: 0,
            type: "Commercial Retail",
            carpetArea: 55.0,
            builtUpArea: 66.0,
            zMin: 0.0,
            zMax: 4.0,
            ownerName: "Apollo Healthco Ltd",
            status: "CLEAR",
            hasConflict: false,
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: "HDFC-MUM-2022-311204",
            position: { x: -4, z: -4, width: 6.5, depth: 6.5 }
          },
          {
            id: "MH-MUM-BND-1245-08-G-G02",
            ulpin3d: "MH-27-04-1245-08-G-G02-Z000004",
            unitNumber: "Shop G-02 (Bank ATM & Branch)",
            floorNumber: 0,
            type: "Commercial Retail",
            carpetArea: 60.0,
            builtUpArea: 72.0,
            zMin: 0.0,
            zMax: 4.0,
            ownerName: "Axis Bank Ltd",
            status: "CLEAR",
            hasConflict: false,
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: "AXIS-MUM-2021-100293",
            position: { x: 4, z: 4, width: 6.5, depth: 6.5 }
          }
        ]
      },
      // Typical Floors 1 to 12
      ...Array.from({ length: 12 }, (_, i) => {
        const floorNum = i + 1;
        const zMin = 4.0 + i * 2.8;
        const zMax = zMin + 2.8;
        return {
          floorNumber: floorNum,
          name: `Floor ${floorNum}`,
          zMin,
          zMax,
          height: 2.8,
          type: "Residential Apartments",
          isSanctioned: true,
          units: [
            {
              id: `MH-MUM-BND-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}01`,
              ulpin3d: `MH-27-04-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}01-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}01`,
              floorNumber: floorNum,
              type: "Residential (2BHK)",
              carpetArea: 62.5,
              builtUpArea: 75.0,
              zMin,
              zMax,
              ownerName: floorNum === 3 ? "Aarav Patel & Sunita Patel" : `Resident ${floorNum}01`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: floorNum === 3 ? null : `ICICI-MUM-2023-${100000 + floorNum * 12}`,
              position: { x: -3.8, z: -3.8, width: 7.2, depth: 7.2 }
            },
            {
              id: `MH-MUM-BND-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}02`,
              ulpin3d: `MH-27-04-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}02-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}02`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 68.5,
              builtUpArea: 82.2,
              zMin,
              zMax,
              ownerName: floorNum === 4 ? "Vikramaditya Sharma & Priya Sharma" : `Resident ${floorNum}02`,
              status: floorNum === 4 ? "CRITICAL_CONFLICT" : "CLEAR",
              hasConflict: floorNum === 4,
              conflictType: floorNum === 4 ? "DUPLICATE_MORTGAGE" : null,
              conflictDetails: floorNum === 4 
                ? "DOUBLE MORTGAGE CLASH: Active primary mortgage registered with State Bank of India (₹1.85 Cr, CERSAI ID: SBI-MUM-2024-884912, Registered: 14-Feb-2024). Incoming loan application from HDFC Bank flagged for identical 3D spatial voxel!"
                : null,
              activeLienBank: floorNum === 4 ? "State Bank of India (Bandra West Branch)" : null,
              lienAmount: floorNum === 4 ? "₹ 1,85,00,000" : null,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: floorNum === 4 ? "SBI-MUM-2024-884912" : `HDFC-MUM-2023-${200000 + floorNum * 14}`,
              position: { x: 3.8, z: -3.8, width: 7.2, depth: 7.2 }
            },
            {
              id: `MH-MUM-BND-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}03`,
              ulpin3d: `MH-27-04-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}03-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}03`,
              floorNumber: floorNum,
              type: "Residential (2BHK)",
              carpetArea: 60.0,
              builtUpArea: 72.0,
              zMin,
              zMax,
              ownerName: `Resident ${floorNum}03`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: `AXIS-MUM-2023-${300000 + floorNum * 11}`,
              position: { x: -3.8, z: 3.8, width: 7.2, depth: 7.2 }
            },
            {
              id: `MH-MUM-BND-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}04`,
              ulpin3d: `MH-27-04-1245-08-F${String(floorNum).padStart(2, '0')}-U${floorNum}04-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}04`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 70.0,
              builtUpArea: 84.0,
              zMin,
              zMax,
              ownerName: `Resident ${floorNum}04`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: `KOTAK-MUM-2023-${400000 + floorNum * 18}`,
              position: { x: 3.8, z: 3.8, width: 7.2, depth: 7.2 }
            }
          ]
        };
      }),
      // Phantom Illegal Floors (13 & 14) Exceeding Municipal Sanction Envelope
      {
        floorNumber: 13,
        name: "Floor 13 (UNAUTHORIZED PHANTOM FLOOR)",
        zMin: 4.0 + 12 * 2.8, // 37.6m
        zMax: 4.0 + 13 * 2.8, // 40.4m (Crosses 38.0m limit)
        height: 2.8,
        type: "Illegal Penthouse Construction",
        isSanctioned: false,
        units: [
          {
            id: "MH-MUM-BND-1245-08-F13-U1301",
            ulpin3d: "MH-27-04-1245-08-F13-U1301-Z376404-UNAUTH",
            unitNumber: "Flat 1301 (Unauthorized)",
            floorNumber: 13,
            type: "Luxury Penthouse",
            carpetArea: 135.0,
            builtUpArea: 162.0,
            zMin: 37.6,
            zMax: 40.4,
            ownerName: "Rajesh K. Developers Pvt Ltd (Purported Sale)",
            status: "SANCTION_BREACH",
            hasConflict: true,
            conflictType: "PHANTOM_FLOOR",
            conflictDetails: "SANCTION ENVELOPE BREACH: Floor 13 constructed above municipal approved FSI cap (Z_max = 38.0m). No Municipal Commencement Certificate issued for this level.",
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: "PNB-MUM-2024-998811",
            position: { x: 0, z: 0, width: 14.5, depth: 14.5 }
          }
        ]
      },
      {
        floorNumber: 14,
        name: "Floor 14 (UNAUTHORIZED PHANTOM FLOOR)",
        zMin: 4.0 + 13 * 2.8, // 40.4m
        zMax: 4.0 + 14 * 2.8, // 43.2m
        height: 2.8,
        type: "Illegal Rooftop Club/Suite",
        isSanctioned: false,
        units: [
          {
            id: "MH-MUM-BND-1245-08-F14-U1401",
            ulpin3d: "MH-27-04-1245-08-F14-U1401-Z404432-UNAUTH",
            unitNumber: "Flat 1401 (Sky Villa - Phantom)",
            floorNumber: 14,
            type: "Sky Villa",
            carpetArea: 140.0,
            builtUpArea: 170.0,
            zMin: 40.4,
            zMax: 43.2,
            ownerName: "Apex Realty Consortium",
            status: "SANCTION_BREACH",
            hasConflict: true,
            conflictType: "PHANTOM_FLOOR",
            conflictDetails: "CRITICAL SANCTION VIOLATION: Total phantom floor constructed 5.2m above permissible sky-plane limit. Severe civil aviation radar obstruction notice issued.",
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: null,
            position: { x: 0, z: 0, width: 14.5, depth: 14.5 }
          }
        ]
      }
    ]
  },
  {
    id: "KA-BLR-WFD-589-22",
    name: "CyberVistas Tech Residences",
    city: "Bengaluru",
    state: "Karnataka",
    district: "Bengaluru Urban",
    sro: "K.R. Puram SRO",
    villageCTS: "Whitefield Khata No. 589/22",
    surveyNumber: "589/22",
    zone: "IT Corridor High-Density Mixed Use (BBMP)",
    parcelAreaSqM: 2400.0,
    coordinates: { lat: 12.9698, lng: 77.7499 },
    sanctionedMaxHeight: 28.0,
    sanctionedFloors: 8,
    actualFloors: 8,
    basementLevels: 2,
    totalUnits: 34,
    activeDisputes: 1,
    subsurfaceMetro: {
      name: "Namma Metro Purple Line Extension",
      depthMin: -14.0,
      depthMax: -8.0,
      bufferRadius: 12.0,
      status: "Clearance Verified - Zero Vibration Impact"
    },
    airRights: {
      elevationMin: 28.0,
      elevationMax: 50.0,
      purpose: "HAL Airport Radar Cone Clearance",
      status: "Height Capped at 28.0m"
    },
    floors: [
      {
        floorNumber: -1,
        name: "Basement 1 (Parking)",
        zMin: -3.5,
        zMax: 0.0,
        height: 3.5,
        type: "Parking Level",
        units: [
          {
            id: "KA-BLR-WFD-589-22-B1-P04",
            ulpin3d: "KA-29-07-0589-22-B1-P04-Z-035000",
            unitNumber: "Parking Slot B1-04",
            floorNumber: -1,
            type: "Car Parking Bay",
            carpetArea: 14.0,
            builtUpArea: 16.5,
            zMin: -3.5,
            zMax: 0.0,
            ownerName: "Dual Claim (Arun Kumar & Sneha Reddy)",
            status: "CRITICAL_CONFLICT",
            hasConflict: true,
            conflictType: "PARKING_CLASH",
            conflictDetails: "DUPLICATE PARKING ALLOCATION: Slot B1-04 assigned to Flat 302 in 2022 Deed and simultaneously pledged with Flat 501 in 2024 Mortgage.",
            ladmClass: "LA_LegalSpaceBuildingUnit",
            cersaiId: "HDFC-BLR-2024-550192",
            position: { x: -3, z: 0, width: 6, depth: 6 }
          }
        ]
      },
      ...Array.from({ length: 8 }, (_, i) => {
        const floorNum = i + 1;
        const zMin = 0.0 + i * 3.2;
        const zMax = zMin + 3.2;
        return {
          floorNumber: floorNum,
          name: `Floor ${floorNum}`,
          zMin,
          zMax,
          height: 3.2,
          type: "Residential Luxury",
          isSanctioned: true,
          units: [
            {
              id: `KA-BLR-WFD-589-22-F${String(floorNum).padStart(2, '0')}-U${floorNum}01`,
              ulpin3d: `KA-29-07-0589-22-F${String(floorNum).padStart(2, '0')}-U${floorNum}01-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}01`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 88.0,
              builtUpArea: 105.0,
              zMin,
              zMax,
              ownerName: `Tech Resident ${floorNum}01`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: `SBI-BLR-2023-${900000 + floorNum}`,
              position: { x: -3.5, z: 0, width: 6.8, depth: 13.0 }
            },
            {
              id: `KA-BLR-WFD-589-22-F${String(floorNum).padStart(2, '0')}-U${floorNum}02`,
              ulpin3d: `KA-29-07-0589-22-F${String(floorNum).padStart(2, '0')}-U${floorNum}02-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}02`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 88.0,
              builtUpArea: 105.0,
              zMin,
              zMax,
              ownerName: `Tech Resident ${floorNum}02`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: `ICICI-BLR-2023-${800000 + floorNum}`,
              position: { x: 3.5, z: 0, width: 6.8, depth: 13.0 }
            }
          ]
        };
      })
    ]
  },
  {
    id: "DL-SW-DWK-044-B",
    name: "Pragati Heights CGHS",
    city: "New Delhi",
    state: "Delhi NCT",
    district: "South West Delhi",
    sro: "Dwarka Sub-Registrar IX",
    villageCTS: "Dwarka Sector 19 Plot 44-B",
    surveyNumber: "44-B",
    zone: "Group Housing Zone (DDA Master Plan 2041)",
    parcelAreaSqM: 3100.0,
    coordinates: { lat: 28.5823, lng: 77.0500 },
    sanctionedMaxHeight: 34.0,
    sanctionedFloors: 10,
    actualFloors: 10,
    basementLevels: 1,
    totalUnits: 40,
    activeDisputes: 1,
    subsurfaceMetro: {
      name: "Delhi Metro Airport Express Line Corridor",
      depthMin: -22.0,
      depthMax: -16.0,
      bufferRadius: 20.0,
      status: "Safe Clearance (6.5m above subway tube crown)"
    },
    airRights: {
      elevationMin: 34.0,
      elevationMax: 48.0,
      purpose: "Rooftop 150 kWp Solar Power Grid Lease",
      status: "Leased to BSES Rajdhani Power Ltd"
    },
    floors: [
      ...Array.from({ length: 10 }, (_, i) => {
        const floorNum = i + 1;
        const zMin = 0.0 + i * 3.1;
        const zMax = zMin + 3.1;
        const isDisputed = floorNum === 7;
        return {
          floorNumber: floorNum,
          name: `Floor ${floorNum}`,
          zMin,
          zMax,
          height: 3.1,
          type: "Residential Standard",
          isSanctioned: true,
          units: [
            {
              id: `DL-SW-DWK-044-B-F${String(floorNum).padStart(2, '0')}-U${floorNum}01`,
              ulpin3d: `DL-07-09-0044-0B-F${String(floorNum).padStart(2, '0')}-U${floorNum}01-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}01`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 78.0,
              builtUpArea: 94.0,
              zMin,
              zMax,
              ownerName: `Owner ${floorNum}01`,
              status: "CLEAR",
              hasConflict: false,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: `PNB-DEL-2022-${700000 + floorNum}`,
              position: { x: -3.5, z: -3.5, width: 6.8, depth: 6.8 }
            },
            {
              id: `DL-SW-DWK-044-B-F${String(floorNum).padStart(2, '0')}-U${floorNum}02`,
              ulpin3d: `DL-07-09-0044-0B-F${String(floorNum).padStart(2, '0')}-U${floorNum}02-Z${String(Math.round(zMin * 10)).padStart(3, '0')}${String(Math.round(zMax * 10)).padStart(3, '0')}`,
              unitNumber: `Flat ${floorNum}02`,
              floorNumber: floorNum,
              type: "Residential (3BHK)",
              carpetArea: 78.0,
              builtUpArea: 94.0,
              zMin,
              zMax,
              ownerName: isDisputed ? "Manish Malhotra & Anita Malhotra" : `Owner ${floorNum}02`,
              status: isDisputed ? "CRITICAL_CONFLICT" : "CLEAR",
              hasConflict: isDisputed,
              conflictType: isDisputed ? "DUPLICATE_MORTGAGE" : null,
              conflictDetails: isDisputed 
                ? "SECOND CHARGE UNREGISTERED CLASH: Punjab National Bank registered first charge of ₹95 Lakhs. Bank of Baroda attempted unauthorized second charge registration without SRO No-Objection."
                : null,
              activeLienBank: isDisputed ? "Punjab National Bank (Dwarka Branch)" : null,
              lienAmount: isDisputed ? "₹ 95,00,000" : null,
              ladmClass: "LA_LegalSpaceBuildingUnit",
              cersaiId: isDisputed ? "PNB-DEL-2023-441092" : `BOB-DEL-2023-${600000 + floorNum}`,
              position: { x: 3.5, z: -3.5, width: 6.8, depth: 6.8 }
            }
          ]
        };
      })
    ]
  }
];

export const DEMO_PRESETS = [
  {
    id: "preset-dup-mortgage",
    title: "Scenario 1: Duplicate Mortgage Fraud (Flat 402)",
    badge: "CRITICAL FRAUD",
    badgeColor: "red",
    parcelId: "MH-MUM-BND-1245-08",
    unitId: "MH-MUM-BND-1245-08-F04-U402",
    applicantName: "Vikramaditya Sharma",
    bankName: "HDFC Bank (Commercial Lending Division)",
    loanAmount: "₹ 1,85,00,000",
    loanType: "Home Loan Refinancing",
    description: "Applicant applied for a fresh loan with HDFC Bank concealing an existing ₹1.85 Cr active mortgage with State Bank of India on the identical 3D vertical space.",
    expectedOutcome: "COLLISION_DETECTED",
    overlapVolume: "205.5 m³",
    overlapPercentage: "100%",
    existingBank: "State Bank of India (Bandra Branch)",
    existingCersai: "SBI-MUM-2024-884912",
    riskScore: 98
  },
  {
    id: "preset-phantom-floor",
    title: "Scenario 2: Phantom 14th Floor Fraud (Flat 1401)",
    badge: "SANCTION BREACH",
    badgeColor: "amber",
    parcelId: "MH-MUM-BND-1245-08",
    unitId: "MH-MUM-BND-1245-08-F14-U1401",
    applicantName: "Apex Realty Consortium",
    bankName: "Axis Bank Ltd",
    loanAmount: "₹ 4,20,00,000",
    loanType: "Construction Finance & Buyer Mortgage",
    description: "Builder built and mortgaged Flat 1401 at Z = 40.4m to 43.2m. Municipal sanctioned height limit is only 38.0m (Floor 12 max). Total phantom air space.",
    expectedOutcome: "SANCTION_BREACH",
    overlapVolume: "392.0 m³ outside envelope",
    overlapPercentage: "100% Non-Sanctioned",
    existingBank: "None (Unauthorized Asset)",
    existingCersai: "N/A - Illegal Floor",
    riskScore: 99
  },
  {
    id: "preset-parking-clash",
    title: "Scenario 3: Double-Allocated Parking Bay (B1-04)",
    badge: "PARKING CLASH",
    badgeColor: "rose",
    parcelId: "KA-BLR-WFD-589-22",
    unitId: "KA-BLR-WFD-589-22-B1-P04",
    applicantName: "Sneha Reddy",
    bankName: "ICICI Bank Ltd",
    loanAmount: "₹ 15,00,000",
    loanType: "Ancillary Parking Unit Mortgage",
    description: "Subsurface parking slot B1-04 pledged in mortgage, but was previously assigned as exclusive appurtenant property to Flat 302.",
    expectedOutcome: "COLLISION_DETECTED",
    overlapVolume: "49.0 m³",
    overlapPercentage: "100%",
    existingBank: "HDFC Bank (Whitefield)",
    existingCersai: "HDFC-BLR-2024-550192",
    riskScore: 92
  },
  {
    id: "preset-safe-property",
    title: "Scenario 4: Verified 100% Clear Title (Flat 301)",
    badge: "CLEAR TITLE",
    badgeColor: "emerald",
    parcelId: "MH-MUM-BND-1245-08",
    unitId: "MH-MUM-BND-1245-08-F03-U301",
    applicantName: "Aarav Patel",
    bankName: "State Bank of India",
    loanAmount: "₹ 1,20,00,000",
    loanType: "First-Time Homebuyer Loan",
    description: "Standard verified 2BHK flat within municipal sanction envelope. Zero existing encumbrances or duplicate 3D bounding claims in CERSAI.",
    expectedOutcome: "SAFE_TO_LEND",
    overlapVolume: "0.0 m³",
    overlapPercentage: "0%",
    existingBank: "None (First Charge)",
    existingCersai: "None",
    riskScore: 4
  }
];

export const SAMPLE_DEEDS = [
  {
    id: "deed-mumbai-402",
    parcelId: "MH-MUM-BND-1245-08",
    title: "Sale Deed - Flat 402, Shanti Heights",
    documentType: "Registered Deed of Conveyance (Index-II)",
    registrationNumber: "BND-4/8912/2024",
    registrationDate: "14-Feb-2024",
    sroOffice: "Sub-Registrar Bandra-4, Mumbai Suburban",
    extractedData: {
      ulpin3d: "MH-27-04-1245-08-F04-U402-Z012015",
      stateCode: "MH (Maharashtra)",
      districtCode: "27 (Mumbai Suburban)",
      sroCode: "04 (Bandra)",
      surveyNo: "1245/8",
      floorNumber: 4,
      unitNumber: "Flat No. 402",
      carpetArea: 68.5,
      builtUpArea: 82.2,
      slabHeightMeters: 3.0,
      elevationZMinMeters: 12.4,
      elevationZMaxMeters: 15.4,
      ownerName: "Vikramaditya Sharma & Priya Sharma",
      panApplicant: "ABCPS1234K",
      aadhaarRef: "XXXX-XXXX-8921",
      considerationAmount: "₹ 2,45,00,000",
      stampDutyPaid: "₹ 14,70,000 (6%)",
      registrationFee: "₹ 30,000",
      boundaryDescription: {
        north: "Flat 401 & Central Lift Lobby Corridor",
        south: "External Roadside Balcony Facing 16th Road",
        east: "Flat 404 Partition Fire-wall",
        west: "Society Compound Open Space"
      },
      spatialGeometry: {
        type: "ExtrudedPolygonPrism",
        coordinates2D: [
          [72.82951, 19.05961],
          [72.82959, 19.05961],
          [72.82959, 19.05968],
          [72.82951, 19.05968]
        ],
        zInterval: [12.4, 15.4],
        volumeM3: 205.5
      },
      ocrConfidence: 99.2,
      ladmValidation: "ISO 19152 PASS"
    }
  },
  {
    id: "deed-delhi-702",
    parcelId: "DL-SW-DWK-044-B",
    title: "Conveyance Deed - Flat 702, Pragati Heights",
    documentType: "DDA Freehold Conveyance Deed",
    registrationNumber: "DWK-9/4412/2023",
    registrationDate: "19-Nov-2023",
    sroOffice: "Sub-Registrar IX, Kapashera, Dwarka",
    extractedData: {
      ulpin3d: "DL-07-09-0044-0B-F07-U702-Z018021",
      stateCode: "DL (Delhi NCT)",
      districtCode: "07 (South West)",
      sroCode: "09 (Dwarka IX)",
      surveyNo: "Plot 44-B, Sector 19",
      floorNumber: 7,
      unitNumber: "Flat No. 702",
      carpetArea: 78.0,
      builtUpArea: 94.0,
      slabHeightMeters: 3.1,
      elevationZMinMeters: 18.6,
      elevationZMaxMeters: 21.7,
      ownerName: "Manish Malhotra & Anita Malhotra",
      panApplicant: "BCDPK9912L",
      aadhaarRef: "XXXX-XXXX-4412",
      considerationAmount: "₹ 1,80,00,000",
      stampDutyPaid: "₹ 10,80,000 (6%)",
      registrationFee: "₹ 18,000",
      boundaryDescription: {
        north: "Flat 701 Staircase Landing",
        south: "Sector 19 Green Belt View",
        east: "Internal Utility Duct & Shaft",
        west: "Plot 44-A Boundary Separation"
      },
      spatialGeometry: {
        type: "ExtrudedPolygonPrism",
        coordinates2D: [
          [77.05012, 28.58231],
          [77.05021, 28.58231],
          [77.05021, 28.58239],
          [77.05012, 28.58239]
        ],
        zInterval: [18.6, 21.7],
        volumeM3: 241.8
      },
      ocrConfidence: 98.6,
      ladmValidation: "ISO 19152 PASS"
    }
  }
];

export const REGISTRAR_STATS = {
  totalUlpinsIssued: "2,418,920",
  verticalDisputesPrevented: "41,290",
  assetsUnlockedCrores: "₹ 84,200 Cr",
  ladmComplianceRate: "99.4%",
  avgVerificationTime: "14 mins",
  fraudTypes: [
    { type: "Duplicate Mortgage (Same Voxel Pledged Twice)", percentage: 48, count: 19819, color: "#EF4444" },
    { type: "Phantom / Unauthorized Extra Floors", percentage: 28, count: 11561, color: "#F59E0B" },
    { type: "Double Allocated Subsurface Parking Bays", percentage: 14, count: 5780, color: "#8B5CF6" },
    { type: "Air-Rights & Metro Easement Encroachments", percentage: 10, count: 4130, color: "#06B6D4" }
  ],
  jurisdictionRollout: [
    { name: "Maharashtra (MMRDA & PMC)", progress: 94, parcels: "840,200", status: "Full 3D Rollout" },
    { name: "Karnataka (BBMP Bangalore)", progress: 88, parcels: "620,100", status: "Phase-2 Active" },
    { name: "Delhi NCT (DDA & MCD)", progress: 82, parcels: "510,400", status: "Phase-2 Active" },
    { name: "Telangana (GHMC Hyderabad)", progress: 79, parcels: "310,000", status: "Phase-1 Live" },
    { name: "Gujarat (AUDA Ahmedabad)", progress: 75, parcels: "138,220", status: "Phase-1 Live" }
  ],
  liveFraudStream: [
    {
      id: "FRD-2026-9921",
      time: "2 mins ago",
      city: "Mumbai (Andheri SRO)",
      ulpin: "MH-27-02-0812-04-F08-U803",
      fraudType: "Duplicate Mortgage Flagged",
      bankBlocked: "Axis Bank rejected loan application on ICICI active lien",
      preventedLoss: "₹ 2.10 Cr",
      status: "BLOCKED"
    },
    {
      id: "FRD-2026-9920",
      time: "8 mins ago",
      city: "Bengaluru (Whitefield SRO)",
      ulpin: "KA-29-07-0589-22-B1-P04",
      fraudType: "Double Parking Bay Assignment",
      bankBlocked: "HDFC mortgage attempt stopped on already encumbered bay",
      preventedLoss: "₹ 18.5 Lakhs",
      status: "BLOCKED"
    },
    {
      id: "FRD-2026-9919",
      time: "15 mins ago",
      city: "Delhi (Dwarka SRO-IX)",
      ulpin: "DL-07-09-0044-0B-F13-U1302",
      fraudType: "Phantom 13th Floor Registry",
      bankBlocked: "Attempted sale deed registration outside 34m DDA height envelope",
      preventedLoss: "₹ 3.45 Cr",
      status: "BLOCKED"
    },
    {
      id: "FRD-2026-9918",
      time: "27 mins ago",
      city: "Hyderabad (Gachibowli SRO)",
      ulpin: "TS-05-12-0941-11-F19-U1901",
      fraudType: "Subsurface Metro Tunnel Buffer Clash",
      bankBlocked: "Piling permission revoked for unauthorized basement excavation",
      preventedLoss: "₹ 12.0 Cr Infrastructure Risk",
      status: "BLOCKED"
    }
  ]
};
