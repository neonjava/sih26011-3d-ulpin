/**
 * Mock Cadastral Building Data for 3D ULPIN System.
 * Conforms strictly to the API contract JSON shape:
 * {
 *   "building_id": "B001",
 *   "floors": [
 *     {
 *       "floor_no": 1,
 *       "units": [
 *         {
 *           "ulpin": "KA-DVG-P001-B001-F01-U01-Z0-3",
 *           "geometry": { ... },
 *           "owner": "mock name",
 *           "type": "residential"
 *         }
 *       ]
 *     }
 *   ],
 *   "underground": [
 *     {
 *       "ulpin": "KA-DVG-P001-B001-FB1-U01-Z-3-0",
 *       "type": "parking"
 *     }
 *   ]
 * }
 */

export const MOCK_BUILDING_DATA = {
  "B001": {
    "building_id": "B001",
    "building_name": "Devanagari Heights (Parcel P001)",
    "city": "Davanagere, Karnataka",
    "address": "Survey No. 42/1, MCC B-Block, Davanagere",
    "total_above_ground_floors": 5,
    "total_underground_levels": 1,
    "sanctioned_height_m": 18.0,
    "parcel_id": "KA-DVG-P001",
    "floors": [
      {
        "floor_no": 1,
        "elevation_base": 0.0,
        "elevation_top": 3.0,
        "units": [
          {
            "ulpin": "KA-DVG-P001-B001-F01-U01-Z0-3",
            "unit_number": "Unit 101",
            "owner": "Ramesh Patil",
            "type": "residential",
            "area_sqm": 68.5,
            "status": "Clear Title",
            "geometry": {
              "x": -3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 0.0,
              "z_max": 3.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F01-U02-Z0-3",
            "unit_number": "Unit 102",
            "owner": "Pooja Hegde",
            "type": "residential",
            "area_sqm": 68.5,
            "status": "Clear Title",
            "geometry": {
              "x": 3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 0.0,
              "z_max": 3.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F01-U03-Z0-3",
            "unit_number": "Unit 103 (Society Office)",
            "owner": "Devanagari Residents Association",
            "type": "utility",
            "area_sqm": 120.0,
            "status": "Common Area",
            "geometry": {
              "x": 0.0,
              "z": 3.8,
              "width": 14.8,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 0.0,
              "z_max": 3.0
            }
          }
        ]
      },
      {
        "floor_no": 2,
        "elevation_base": 3.0,
        "elevation_top": 6.0,
        "units": [
          {
            "ulpin": "KA-DVG-P001-B001-F02-U01-Z3-6",
            "unit_number": "Unit 201",
            "owner": "Ananya Sharma",
            "type": "residential",
            "area_sqm": 72.0,
            "status": "Clear Title",
            "geometry": {
              "x": -3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 3.0,
              "z_max": 6.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F02-U02-Z3-6",
            "unit_number": "Unit 202",
            "owner": "Karthik Gowda",
            "type": "residential",
            "area_sqm": 72.0,
            "status": "Mortgaged (SBI)",
            "geometry": {
              "x": 3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 3.0,
              "z_max": 6.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F02-U03-Z3-6",
            "unit_number": "Unit 203",
            "owner": "Meera Joshi",
            "type": "residential",
            "area_sqm": 120.0,
            "status": "Clear Title",
            "geometry": {
              "x": 0.0,
              "z": 3.8,
              "width": 14.8,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 3.0,
              "z_max": 6.0
            }
          }
        ]
      },
      {
        "floor_no": 3,
        "elevation_base": 6.0,
        "elevation_top": 9.0,
        "units": [
          {
            "ulpin": "KA-DVG-P001-B001-F03-U01-Z6-9",
            "unit_number": "Unit 301",
            "owner": "Suresh Kumar",
            "type": "residential",
            "area_sqm": 74.0,
            "status": "Clear Title",
            "geometry": {
              "x": -3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 6.0,
              "z_max": 9.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F03-U02-Z6-9",
            "unit_number": "Unit 302",
            "owner": "Deepak & Shilpa Roy",
            "type": "residential",
            "area_sqm": 74.0,
            "status": "Clear Title",
            "geometry": {
              "x": 3.8,
              "z": -3.8,
              "width": 7.2,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 6.0,
              "z_max": 9.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F03-U03-Z6-9",
            "unit_number": "Unit 303 (Floor Electrical & Solar Hub)",
            "owner": "Devanagari Solar Co-op",
            "type": "utility",
            "area_sqm": 120.0,
            "status": "Utility Ingress",
            "geometry": {
              "x": 0.0,
              "z": 3.8,
              "width": 14.8,
              "depth": 7.2,
              "height": 2.7,
              "z_min": 6.0,
              "z_max": 9.0
            }
          }
        ]
      },
      {
        "floor_no": 4,
        "elevation_base": 9.0,
        "elevation_top": 12.0,
        "units": [
          {
            "ulpin": "KA-DVG-P001-B001-F04-U01-Z9-12",
            "unit_number": "Unit 401",
            "owner": "Vikramaditya Deshmukh",
            "type": "residential",
            "area_sqm": 85.0,
            "status": "Clear Title",
            "geometry": {
              "x": -3.8,
              "z": 0.0,
              "width": 7.2,
              "depth": 14.8,
              "height": 2.7,
              "z_min": 9.0,
              "z_max": 12.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F04-U02-Z9-12",
            "unit_number": "Unit 402",
            "owner": "Lakshmi Narayanan",
            "type": "residential",
            "area_sqm": 85.0,
            "status": "Clear Title",
            "geometry": {
              "x": 3.8,
              "z": 0.0,
              "width": 7.2,
              "depth": 14.8,
              "height": 2.7,
              "z_min": 9.0,
              "z_max": 12.0
            }
          }
        ]
      },
      {
        "floor_no": 5,
        "elevation_base": 12.0,
        "elevation_top": 15.0,
        "units": [
          {
            "ulpin": "KA-DVG-P001-B001-F05-U01-Z12-15",
            "unit_number": "Penthouse 501",
            "owner": "Dr. Raghavendra Rao",
            "type": "residential",
            "area_sqm": 110.0,
            "status": "Clear Title",
            "geometry": {
              "x": -3.8,
              "z": 0.0,
              "width": 7.2,
              "depth": 14.8,
              "height": 2.7,
              "z_min": 12.0,
              "z_max": 15.0
            }
          },
          {
            "ulpin": "KA-DVG-P001-B001-F05-U02-Z12-15",
            "unit_number": "Penthouse 502",
            "owner": "Sneha Kulkarni",
            "type": "residential",
            "area_sqm": 110.0,
            "status": "Clear Title",
            "geometry": {
              "x": 3.8,
              "z": 0.0,
              "width": 7.2,
              "depth": 14.8,
              "height": 2.7,
              "z_min": 12.0,
              "z_max": 15.0
            }
          }
        ]
      }
    ],
    "underground": [
      {
        "ulpin": "KA-DVG-P001-B001-FB1-U01-Z-3-0",
        "floor_no": -1,
        "unit_number": "Bay B1-P01 (Resident Slots 1-4)",
        "owner": "Society Resident Parking Bay A",
        "type": "parking",
        "area_sqm": 60.0,
        "status": "Allotted",
        "geometry": {
          "x": -3.8,
          "z": -3.8,
          "width": 7.2,
          "depth": 7.2,
          "height": 2.7,
          "z_min": -3.0,
          "z_max": 0.0
        }
      },
      {
        "ulpin": "KA-DVG-P001-B001-FB1-U02-Z-3-0",
        "floor_no": -1,
        "unit_number": "Bay B1-P02 (EV Charging Stalls)",
        "owner": "Smart EV Hub Ltd",
        "type": "parking",
        "area_sqm": 60.0,
        "status": "Leased",
        "geometry": {
          "x": 3.8,
          "z": -3.8,
          "width": 7.2,
          "depth": 7.2,
          "height": 2.7,
          "z_min": -3.0,
          "z_max": 0.0
        }
      },
      {
        "ulpin": "KA-DVG-P001-B001-FB1-U03-Z-3-0",
        "floor_no": -1,
        "unit_number": "Basement Utility (Substation & STP)",
        "owner": "BESCOM & Municipal Water Works",
        "type": "utility",
        "area_sqm": 120.0,
        "status": "Critical Infrastructure",
        "geometry": {
          "x": 0.0,
          "z": 3.8,
          "width": 14.8,
          "depth": 7.2,
          "height": 2.7,
          "z_min": -3.0,
          "z_max": 0.0
        }
      }
    ]
  },
  "B002": {
    "building_id": "B002",
    "building_name": "Whitefield Silicon Towers (Parcel P002)",
    "city": "Bengaluru, Karnataka",
    "address": "Plot 18, ITPL Main Road, Whitefield, Bengaluru",
    "total_above_ground_floors": 5,
    "total_underground_levels": 1,
    "sanctioned_height_m": 18.0,
    "parcel_id": "KA-BLR-P002",
    "floors": [
      {
        "floor_no": 1,
        "elevation_base": 0.0,
        "elevation_top": 3.0,
        "units": [
          {
            "ulpin": "KA-BLR-P002-B002-F01-U01-Z0-3",
            "unit_number": "Tech Suite 101",
            "owner": "NexGen AI Labs",
            "type": "utility",
            "area_sqm": 75.0,
            "status": "Clear Title",
            "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 0.0, "z_max": 3.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F01-U02-Z0-3",
            "unit_number": "Flat 102",
            "owner": "Rahul Varma",
            "type": "residential",
            "area_sqm": 75.0,
            "status": "Clear Title",
            "geometry": { "x": 3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 0.0, "z_max": 3.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F01-U03-Z0-3",
            "unit_number": "Cafeteria & Lounge 103",
            "owner": "Silicon Hospitality Pvt Ltd",
            "type": "utility",
            "area_sqm": 120.0,
            "status": "Clear Title",
            "geometry": { "x": 0.0, "z": 3.8, "width": 14.8, "depth": 7.2, "height": 2.7, "z_min": 0.0, "z_max": 3.0 }
          }
        ]
      },
      {
        "floor_no": 2,
        "elevation_base": 3.0,
        "elevation_top": 6.0,
        "units": [
          {
            "ulpin": "KA-BLR-P002-B002-F02-U01-Z3-6",
            "unit_number": "Flat 201",
            "owner": "Swati Deshpande",
            "type": "residential",
            "area_sqm": 80.0,
            "status": "Clear Title",
            "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 3.0, "z_max": 6.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F02-U02-Z3-6",
            "unit_number": "Flat 202",
            "owner": "Varun Reddy",
            "type": "residential",
            "area_sqm": 80.0,
            "status": "Mortgaged (HDFC)",
            "geometry": { "x": 3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 3.0, "z_max": 6.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F02-U03-Z3-6",
            "unit_number": "Flat 203",
            "owner": "Priya Nair",
            "type": "residential",
            "area_sqm": 120.0,
            "status": "Clear Title",
            "geometry": { "x": 0.0, "z": 3.8, "width": 14.8, "depth": 7.2, "height": 2.7, "z_min": 3.0, "z_max": 6.0 }
          }
        ]
      },
      {
        "floor_no": 3,
        "elevation_base": 6.0,
        "elevation_top": 9.0,
        "units": [
          {
            "ulpin": "KA-BLR-P002-B002-F03-U01-Z6-9",
            "unit_number": "Flat 301",
            "owner": "Tanvi & Amit Saxena",
            "type": "residential",
            "area_sqm": 82.0,
            "status": "Clear Title",
            "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 6.0, "z_max": 9.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F03-U02-Z6-9",
            "unit_number": "Flat 302",
            "owner": "Gautam Ghosh",
            "type": "residential",
            "area_sqm": 82.0,
            "status": "Clear Title",
            "geometry": { "x": 3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": 6.0, "z_max": 9.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F03-U03-Z6-9",
            "unit_number": "Server Room & Network Backbone",
            "owner": "Airtel Enterprise Fiber",
            "type": "utility",
            "area_sqm": 120.0,
            "status": "Utility Lease",
            "geometry": { "x": 0.0, "z": 3.8, "width": 14.8, "depth": 7.2, "height": 2.7, "z_min": 6.0, "z_max": 9.0 }
          }
        ]
      },
      {
        "floor_no": 4,
        "elevation_base": 9.0,
        "elevation_top": 12.0,
        "units": [
          {
            "ulpin": "KA-BLR-P002-B002-F04-U01-Z9-12",
            "unit_number": "Flat 401",
            "owner": "Manish & Shweta Bhatia",
            "type": "residential",
            "area_sqm": 90.0,
            "status": "Clear Title",
            "geometry": { "x": -3.8, "z": 0.0, "width": 7.2, "depth": 14.8, "height": 2.7, "z_min": 9.0, "z_max": 12.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F04-U02-Z9-12",
            "unit_number": "Flat 402",
            "owner": "Aditya Sengupta",
            "type": "residential",
            "area_sqm": 90.0,
            "status": "Clear Title",
            "geometry": { "x": 3.8, "z": 0.0, "width": 7.2, "depth": 14.8, "height": 2.7, "z_min": 9.0, "z_max": 12.0 }
          }
        ]
      },
      {
        "floor_no": 5,
        "elevation_base": 12.0,
        "elevation_top": 15.0,
        "units": [
          {
            "ulpin": "KA-BLR-P002-B002-F05-U01-Z12-15",
            "unit_number": "Sky Villa 501",
            "owner": "Pranav Murthy",
            "type": "residential",
            "area_sqm": 125.0,
            "status": "Clear Title",
            "geometry": { "x": -3.8, "z": 0.0, "width": 7.2, "depth": 14.8, "height": 2.7, "z_min": 12.0, "z_max": 15.0 }
          },
          {
            "ulpin": "KA-BLR-P002-B002-F05-U02-Z12-15",
            "unit_number": "Sky Villa 502",
            "owner": "Nalini & Vivek Sundaram",
            "type": "residential",
            "area_sqm": 125.0,
            "status": "Clear Title",
            "geometry": { "x": 3.8, "z": 0.0, "width": 7.2, "depth": 14.8, "height": 2.7, "z_min": 12.0, "z_max": 15.0 }
          }
        ]
      }
    ],
    "underground": [
      {
        "ulpin": "KA-BLR-P002-B002-FB1-U01-Z-3-0",
        "floor_no": -1,
        "unit_number": "Basement Parking Bay A",
        "owner": "Commercial Stacker Parking",
        "type": "parking",
        "area_sqm": 65.0,
        "status": "Allotted",
        "geometry": { "x": -3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": -3.0, "z_max": 0.0 }
      },
      {
        "ulpin": "KA-BLR-P002-B002-FB1-U02-Z-3-0",
        "floor_no": -1,
        "unit_number": "Basement Parking Bay B",
        "owner": "Visitor & Tech Parking",
        "type": "parking",
        "area_sqm": 65.0,
        "status": "Allotted",
        "geometry": { "x": 3.8, "z": -3.8, "width": 7.2, "depth": 7.2, "height": 2.7, "z_min": -3.0, "z_max": 0.0 }
      },
      {
        "ulpin": "KA-BLR-P002-B002-FB1-U03-Z-3-0",
        "floor_no": -1,
        "unit_number": "HVAC Chiller & DG Set Room",
        "owner": "Building Facilities Management",
        "type": "utility",
        "area_sqm": 120.0,
        "status": "Critical Utility",
        "geometry": { "x": 0.0, "z": 3.8, "width": 14.8, "depth": 7.2, "height": 2.7, "z_min": -3.0, "z_max": 0.0 }
      }
    ]
  }
};
