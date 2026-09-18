import type { InvestigationResponse } from '../types/investigation';

export const MOCK_INVESTIGATIONS: Record<string, InvestigationResponse> = {
  // Scenario 1: Single-image VQA
  scenario_vqa: {
    investigation_id: 'inv_vqa_8921',
    status: 'completed',
    query: 'Describe the land-cover and major objects visible in this image.',
    created_at: '2026-09-15T07:12:00Z',
    tasks: [
      {
        task_id: 'task_vqa_01',
        task_type: 'vqa',
        image_ids: ['img_s2_optical_t1'],
        query: 'Describe the land-cover and major objects visible in this image.',
        parameters: { max_tokens: 256, temperature: 0.1 },
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery RS-VLM',
          version: 'v0.1.0',
          task: 'VQA & Scene Reasoning',
          description: 'Remote-sensing vision-language model',
          status: 'success',
          output: {
            classes_detected: ['water_body', 'agricultural_land', 'urban_builtup', 'arterial_road', 'port_docks'],
            dominant_class: 'urban_builtup'
          }
        }
      ],
      evidence: [
        {
          id: 'ev_01',
          type: 'Scene',
          description: 'Mixed coastal urban scene characterized by sharp boundary between water body and infrastructure.',
          source: 'SatQuery RS-VLM',
          task: 'task_vqa_01',
          model_version: 'v0.1.0',
          metrics: { scene_diversity_index: 0.84 }
        },
        {
          id: 'ev_02',
          type: 'Visual',
          description: 'Tidal estuary in southern sector displays characteristic low spectral reflectance across visible bands (B2, B3, B4).',
          source: 'SatQuery RS-VLM',
          task: 'task_vqa_01',
          model_version: 'v0.1.0',
          metrics: { water_reflectance_mean: 0.042 }
        },
        {
          id: 'ev_03',
          type: 'Spatial',
          description: 'High-density urban grid concentrated in the northeast quadrant with orthogonal road alignment and dock infrastructure.',
          source: 'SatQuery RS-VLM',
          task: 'task_vqa_01',
          model_version: 'v0.1.0',
          metrics: { urban_fraction: 0.43 }
        }
      ],
      confidence: {
        score: 0.942,
        label: 'HIGH',
        associated_model: 'SatQuery RS-VLM',
        task_type: 'VQA',
        factors: ['High signal-to-noise ratio in optical bands', 'Distinct spectral contrast between water and built-up land']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:12:00.102Z', details: 'Natural language query received and parsed for scene classification intent.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:12:00.245Z', details: 'Selected single-task VQA pipeline with SatQuery RS-VLM.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:12:00.310Z', details: 'Verified task parameters and input image requirements.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:12:00.412Z', details: 'Validated single raster (1024x1024, EPSG:32643, 3 bands).' },
        { step: 'dependency_resolution', status: 'completed', timestamp: '2026-09-15T07:12:00.420Z', details: 'No predecessor tasks; immediate execution scheduled.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:12:01.650Z', details: 'SatQuery RS-VLM executed forward pass in 1,230ms.' },
        { step: 'evidence_collection', status: 'completed', timestamp: '2026-09-15T07:12:01.780Z', details: 'Extracted 3 evidence items across Scene, Visual, and Spatial domains.' },
        { step: 'conflict_detection', status: 'completed', timestamp: '2026-09-15T07:12:01.810Z', details: 'Zero model disagreements detected.' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:12:01.890Z', details: 'Calculated composite confidence score of 94.2% (HIGH).' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:12:01.920Z', details: 'Investigation finalized and ready for report generation.' }
      ]
    },
    finding: {
      summary: 'Mixed Coastal Urban & Estuary Landscape',
      task_type: 'vqa',
      answer: 'The satellite imagery depicts a coastal estuary occupying the southern quadrant, bordered by agricultural plots in the west and an organized high-density urban sector with an arterial transport highway and shipping dock infrastructure in the northeast.'
    },
    message: 'Investigation completed successfully'
  },

  // Scenario 2: Single-image Grounding
  scenario_grounding: {
    investigation_id: 'inv_grd_4412',
    status: 'completed',
    query: 'Highlight the water body referred to in the query.',
    created_at: '2026-09-15T07:15:00Z',
    tasks: [
      {
        task_id: 'task_grd_01',
        task_type: 'grounding',
        image_ids: ['img_s2_optical_t1'],
        query: 'Highlight the water body referred to in the query.',
        parameters: { target_concept: 'water body', iou_threshold: 0.5 },
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery Grounding',
          version: 'v0.1.0',
          task: 'Grounding & Entity Localization',
          description: 'Text-guided spatial locator generating georeferenced bounding boxes',
          status: 'success',
          output: {
            candidate_boxes: 1,
            top_iou: 0.961
          }
        }
      ],
      evidence: [
        {
          id: 'ev_grd_01',
          type: 'Spatial',
          description: 'Bounding polygon accurately delineates coastal estuary and tidal channel in southern quadrant.',
          source: 'SatQuery Grounding',
          task: 'task_grd_01',
          model_version: 'v0.1.0',
          metrics: { bbox_normalized: [0.44, 0.0, 1.0, 1.0], area_coverage_pct: 34.2 }
        },
        {
          id: 'ev_grd_02',
          type: 'Visual',
          description: 'Near-infrared band (B8) absorption signature strongly differentiates water surface from surrounding vegetated and urban banks.',
          source: 'SatQuery Grounding',
          task: 'task_grd_01',
          model_version: 'v0.1.0',
          metrics: { ndwi_threshold: 0.32 }
        }
      ],
      confidence: {
        score: 0.961,
        label: 'HIGH',
        associated_model: 'SatQuery Grounding',
        task_type: 'Grounding',
        factors: ['High spatial boundary clarity', 'Unambiguous NDWI water absorption index']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:15:00.080Z', details: 'Grounding query received with target entity: water body.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:15:00.190Z', details: 'Initialized spatial grounding sub-pipeline.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:15:00.220Z', details: 'Validated single-image optical grounding parameters.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:15:00.310Z', details: 'Optical raster georeference confirmed.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:15:01.450Z', details: 'SatQuery Grounding model identified target bounding box.' },
        { step: 'evidence_collection', status: 'completed', timestamp: '2026-09-15T07:15:01.550Z', details: 'Collected spatial bounding metrics and NDWI distribution.' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:15:01.620Z', details: 'Confidence computed at 96.1% (HIGH).' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:15:01.640Z', details: 'Grounding overlay generated.' }
      ]
    },
    finding: {
      summary: 'Water Body (Tidal Estuary) Successfully Localized',
      task_type: 'grounding',
      regions: [
        {
          id: 'reg_water_01',
          label: 'Tidal Estuary Basin (NDWI > 0.3)',
          bbox: [0.44, 0.0, 1.0, 1.0],
          geo_coordinates: { latitude: 18.96, longitude: 72.88 },
          confidence: 0.961
        }
      ]
    },
    message: 'Water body localization completed'
  },

  // Scenario 3: Bi-temporal change analysis
  scenario_change: {
    investigation_id: 'inv_chg_7739',
    status: 'completed',
    query: 'What changed between these two dates, and where did the change occur?',
    created_at: '2026-09-15T07:18:00Z',
    tasks: [
      {
        task_id: 'task_chg_01',
        task_type: 'change_detection',
        image_ids: ['img_s2_optical_t1', 'img_s2_optical_t2'],
        query: 'What changed between these two dates, and where did the change occur?',
        parameters: { method: 'siamese_feature_diff', sensitivity: 'medium' },
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery Change Model',
          version: 'v0.1.0',
          task: 'Change Analysis',
          description: 'Bi-temporal Siamese feature difference network for urban dynamics',
          status: 'success',
          output: {
            change_detected: true,
            change_type: 'Urban expansion and land clearance',
            affected_area_hectares: 24.6
          }
        }
      ],
      evidence: [
        {
          id: 'ev_chg_01',
          type: 'Temporal',
          description: 'Significant spectral reflectance divergence identified between T1 (2024-01-15) and T2 (2024-03-20) in the central-western sector.',
          source: 'SatQuery Change Model',
          task: 'task_chg_01',
          model_version: 'v0.1.0',
          metrics: { delta_spectral_distance: 0.76 }
        },
        {
          id: 'ev_chg_02',
          type: 'Visual',
          description: 'Agricultural vegetation plots replaced by cleared soil, graded earthworks, and newly erected structural foundations.',
          source: 'SatQuery Change Model',
          task: 'task_chg_01',
          model_version: 'v0.1.0',
          metrics: { ndvi_loss_rate: -0.48 }
        },
        {
          id: 'ev_chg_03',
          type: 'Spatial',
          description: 'Change concentrated in bounding sector [x: 50..330, y: 160..310], directly adjacent to existing arterial highway.',
          source: 'SatQuery Change Model',
          task: 'task_chg_01',
          model_version: 'v0.1.0',
          metrics: { centroid_offset_m: 140 }
        }
      ],
      confidence: {
        score: 0.936,
        label: 'HIGH',
        associated_model: 'SatQuery Change Model',
        task_type: 'Change Analysis',
        factors: ['Co-registered raster alignment verified', 'Strong feature-space divergence above 3.2 sigma threshold']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:18:00.100Z', details: 'Bi-temporal change detection request received.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:18:00.220Z', details: 'Generated Siamese difference pipeline for pair (img_s2_optical_t1, img_s2_optical_t2).' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:18:00.260Z', details: 'Verified temporal sequence and sensor configuration.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:18:00.410Z', details: 'Confirmed matching CRS (EPSG:32643), 10m GSD, and spatial overlap.' },
        { step: 'dependency_resolution', status: 'completed', timestamp: '2026-09-15T07:18:00.430Z', details: 'Pair inputs verified and loaded into inference cache.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:18:02.120Z', details: 'SatQuery Change Model completed inference in 1,690ms.' },
        { step: 'evidence_collection', status: 'completed', timestamp: '2026-09-15T07:18:02.240Z', details: 'Synthesized 3 temporal and spatial evidence items.' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:18:02.310Z', details: 'Calculated backend confidence score 93.6% (HIGH).' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:18:02.340Z', details: 'Bi-temporal comparison matrix completed.' }
      ]
    },
    finding: {
      summary: 'Land-cover change detected',
      task_type: 'change_detection',
      change_detected: true,
      change_type: 'Urban expansion and vegetative clearing',
      regions: [
        {
          id: 'reg_chg_01',
          label: 'Altered Urban/Industrial Sector (+24.6 ha)',
          bbox: [0.20, 0.06, 0.39, 0.41],
          geo_coordinates: { latitude: 18.99, longitude: 72.85 },
          confidence: 0.936
        }
      ]
    },
    message: 'Change detection investigation completed successfully'
  },

  // Scenario 4: Change analysis + grounding dependency
  scenario_dag: {
    investigation_id: 'inv_dag_3028',
    status: 'completed',
    query: 'Has the built-up area increased, decreased, or remained unchanged? Ground the altered sectors.',
    created_at: '2026-09-15T07:22:00Z',
    tasks: [
      {
        task_id: 'task_step_1_change',
        task_type: 'change_detection',
        image_ids: ['img_s2_optical_t1', 'img_s2_optical_t2'],
        query: 'Has the built-up area increased, decreased, or remained unchanged?',
        parameters: { mode: 'structural_dynamics' },
        status: 'completed'
      },
      {
        task_id: 'task_step_2_grounding',
        task_type: 'grounding',
        image_ids: ['img_s2_optical_t2'],
        query: 'Ground the altered sectors identified in change analysis.',
        parameters: { source_task_ref: 'task_step_1_change', min_confidence: 0.8 },
        depends_on: ['task_step_1_change'],
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery Change Model',
          version: 'v0.1.0',
          task: 'Change Analysis',
          description: 'Siamese difference backbone',
          status: 'success',
          output: { decision: 'increased', delta_sq_km: 0.246 }
        },
        {
          model_name: 'SatQuery Grounding',
          version: 'v0.1.0',
          task: 'Grounding & Entity Localization',
          description: 'Spatial localization conditioned on change mask',
          status: 'success',
          output: { localized_boxes: 2 }
        }
      ],
      evidence: [
        {
          id: 'ev_dag_01',
          type: 'Temporal',
          description: 'Siamese feature difference isolates an increase in man-made impervious surfaces.',
          source: 'SatQuery Change Model',
          task: 'task_step_1_change',
          model_version: 'v0.1.0',
          metrics: { builtup_increase_ratio: 0.184 }
        },
        {
          id: 'ev_dag_02',
          type: 'Spatial',
          description: 'Grounding model pinpoints new construction sector along western transport spur.',
          source: 'SatQuery Grounding',
          task: 'task_step_2_grounding',
          model_version: 'v0.1.0',
          metrics: { iou_overlap: 0.912 }
        }
      ],
      confidence: {
        score: 0.928,
        label: 'HIGH',
        associated_model: 'SatQuery Grounding',
        task_type: 'Change & Grounding Pipeline',
        factors: ['Multi-stage consensus', 'Sub-pixel co-registration tolerance within 0.2px']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:22:00.090Z', details: 'Multi-step mission received: Change Classification followed by Spatial Grounding.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:22:00.210Z', details: 'Synthesized 2-task DAG with dependency: task_step_1_change -> task_step_2_grounding.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:22:00.250Z', details: 'Validated DAG acyclicity and parameter contracts.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:22:00.380Z', details: 'Both bi-temporal optical rasters validated for EPSG:32643.' },
        { step: 'dependency_resolution', status: 'completed', timestamp: '2026-09-15T07:22:00.410Z', details: 'Executing stage 1: task_step_1_change.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:22:01.890Z', details: 'SatQuery Change Model completed. Output piped to SatQuery Grounding.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:22:02.940Z', details: 'SatQuery Grounding completed downstream spatial extraction.' },
        { step: 'evidence_collection', status: 'completed', timestamp: '2026-09-15T07:22:03.040Z', details: 'Aggregated cross-task temporal and spatial evidence.' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:22:03.110Z', details: 'Joint pipeline confidence computed at 92.8% (HIGH).' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:22:03.140Z', details: 'Agentic DAG workflow executed successfully.' }
      ]
    },
    finding: {
      summary: 'Built-up Area Has Increased (Expansion Confirmed)',
      task_type: 'change_detection',
      change_detected: true,
      change_type: 'Urban Expansion (+18.4% local sector gain)',
      regions: [
        {
          id: 'reg_dag_01',
          label: 'Primary Expansion Zone (Excavation & Framework)',
          bbox: [0.20, 0.06, 0.39, 0.41],
          geo_coordinates: { latitude: 18.99, longitude: 72.85 },
          confidence: 0.928
        }
      ]
    },
    message: 'Multi-step DAG investigation completed successfully'
  },

  // Scenario 5: Optical + SAR analysis
  scenario_optical_sar: {
    investigation_id: 'inv_opsar_6190',
    status: 'completed',
    query: 'Use the optical and SAR images together to identify built-up and water-covered regions.',
    created_at: '2026-09-15T07:26:00Z',
    tasks: [
      {
        task_id: 'task_crossmodal_01',
        task_type: 'optical_sar',
        image_ids: ['img_s2_optical_t1', 'img_s1_sar_t1'],
        query: 'Use the optical and SAR images together to identify built-up and water-covered regions.',
        parameters: { fusion_scheme: 'feature_level_alignment', bands_sar: ['VV', 'VH'] },
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery Optical-SAR Fusion',
          version: 'v0.1.0',
          task: 'Optical-SAR Cross-Modal Analysis',
          description: 'Multi-modal feature alignment network',
          status: 'success',
          output: {
            water_agreement_score: 0.982,
            urban_backscatter_intensity_db: 8.4,
            water_backscatter_intensity_db: -24.1
          }
        }
      ],
      evidence: [
        {
          id: 'ev_opsar_01',
          type: 'Cross-modal',
          description: 'Water body in southern bay shows dual confirmation: low optical reflectance across bands 2-4 and near-zero microwave SAR backscatter (-24.1 dB) due to specular surface reflection.',
          source: 'SatQuery Optical-SAR Fusion',
          task: 'task_crossmodal_01',
          model_version: 'v0.1.0',
          metrics: { multi_sensor_concordance: 0.982 }
        },
        {
          id: 'ev_opsar_02',
          type: 'Cross-modal',
          description: 'Northeast urban structures produce intense double-bounce dihedral microwave returns (+8.4 dB), corroborating dense geometric built-up textures visible in optical bands.',
          source: 'SatQuery Optical-SAR Fusion',
          task: 'task_crossmodal_01',
          model_version: 'v0.1.0',
          metrics: { sar_double_bounce_ratio: 3.8 }
        },
        {
          id: 'ev_opsar_03',
          type: 'Scene',
          description: 'All-weather penetration confirms absence of standing floodwater within the northeast urban district.',
          source: 'SatQuery Optical-SAR Fusion',
          task: 'task_crossmodal_01',
          model_version: 'v0.1.0'
        }
      ],
      confidence: {
        score: 0.954,
        label: 'HIGH',
        associated_model: 'SatQuery Optical-SAR Fusion',
        task_type: 'Optical-SAR Analysis',
        factors: ['Multi-frequency cross-validation', 'Specular radar absorption coincides with optical NDWI']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:26:00.110Z', details: 'Cross-modal mission initiated with Optical + SAR pair.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:26:00.230Z', details: 'Selected SatQuery Optical-SAR Fusion network with dual-branch encoder.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:26:00.270Z', details: 'Validated cross-modal sensor pairings.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:26:00.420Z', details: 'Both rasters share EPSG:32643, identical spatial bounds, and 10.0m GSD.' },
        { step: 'dependency_resolution', status: 'completed', timestamp: '2026-09-15T07:26:00.440Z', details: 'Co-registered radiometric bands aligned.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:26:02.150Z', details: 'Dual-branch cross-attention fusion completed in 1,710ms.' },
        { step: 'evidence_collection', status: 'completed', timestamp: '2026-09-15T07:26:02.280Z', details: 'Compiled 3 cross-modal evidence items.' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:26:02.350Z', details: 'Calculated cross-modal confidence at 95.4% (HIGH).' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:26:02.380Z', details: 'All-weather investigation completed.' }
      ]
    },
    finding: {
      summary: 'Cross-Modal Verification Confirms Built-up and Water Boundaries',
      task_type: 'optical_sar',
      cross_modal_finding: 'Optical spectral signatures in the southern basin are verified by Sentinel-1 C-band SAR exhibiting zero specular backscatter (-24.1 dB), definitively identifying the water body. Intense dihedral double-bounce radar returns (+8.4 dB) in the northeast corroborate high-density concrete and steel structures, distinguishing them from rough bare soil.'
    },
    message: 'Cross-modal investigation completed successfully'
  },

  // Scenario 6: Compatibility failure
  scenario_compat_fail: {
    investigation_id: 'inv_compat_0911',
    status: 'failed',
    query: 'Compare changes between these two candidate satellite tiles.',
    created_at: '2026-09-15T07:28:00Z',
    tasks: [
      {
        task_id: 'task_compat_01',
        task_type: 'raster_compatibility',
        image_ids: ['img_s2_optical_t1', 'img_incompatible_raster'],
        query: 'Compare changes between these two candidate satellite tiles.',
        parameters: { strict_spatial_check: true },
        status: 'failed'
      }
    ],
    execution: {
      model_results: [],
      evidence: [],
      confidence: {
        score: 0.0,
        label: 'LOW',
        associated_model: 'Raster Engine',
        task_type: 'Compatibility Check',
        factors: ['Severe spatial and coordinate system discrepancies']
      },
      conflicts: [],
      compatibility: {
        compatible: false,
        reasons: [
          'different CRS (Image 1: EPSG:32643 UTM 43N vs Image 2: EPSG:4326 WGS84)',
          'no spatial overlap (Bounding boxes [72.82..72.95, 18.92..19.05] and [85.12..85.25, 25.58..25.71] are disjoint)',
          'resolution mismatch (Image 1: 10.0m GSD vs Image 2: 60.0m GSD)',
          'different raster dimensions (Image 1: 1024x1024 vs Image 2: 512x512)',
          'grid misalignment (Projected affine matrix rotation offset detected)'
        ]
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:28:00.080Z', details: 'Dual raster investigation request received.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:28:00.180Z', details: 'Created comparative change plan.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:28:00.220Z', details: 'Plan syntax valid; initiating raster compatibility audit.' },
        { step: 'raster_compatibility', status: 'failed', timestamp: '2026-09-15T07:28:00.390Z', details: 'Incompatible CRS and disjoint spatial bounds detected. Execution aborted to prevent invalid inference.' }
      ]
    },
    message: 'Raster compatibility check failed. Investigation halted before model execution.'
  },

  // Scenario 7: Model conflict
  scenario_conflict: {
    investigation_id: 'inv_conf_5129',
    status: 'completed',
    query: 'Determine whether the western agricultural sector is flooded or in vegetative drought.',
    created_at: '2026-09-15T07:31:00Z',
    tasks: [
      {
        task_id: 'task_conf_opt',
        task_type: 'vqa',
        image_ids: ['img_s2_optical_t1'],
        query: 'Assess vegetative drought status via optical spectral response.',
        parameters: { band: 'optical_rgb_nir' },
        status: 'completed'
      },
      {
        task_id: 'task_conf_sar',
        task_type: 'optical_sar',
        image_ids: ['img_s1_sar_t1'],
        query: 'Assess ground saturation via microwave backscatter.',
        parameters: { polarization: 'VV' },
        status: 'completed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery RS-VLM',
          version: 'v0.1.0',
          task: 'VQA & Scene Reasoning',
          description: 'Optical spectral feature classifier',
          status: 'success',
          output: { classification: 'drought_fallow_land', ndvi_mean: 0.11 }
        },
        {
          model_name: 'SatQuery Optical-SAR Fusion',
          version: 'v0.1.0',
          task: 'Optical-SAR Cross-Modal Analysis',
          description: 'Microwave dielectric permittivity estimator',
          status: 'success',
          output: { classification: 'sub_canopy_flooding', dielectric_constant: 28.4 }
        }
      ],
      evidence: [
        {
          id: 'ev_conf_01',
          type: 'Visual',
          description: 'Optical imagery reveals high reflectance in visible red and degraded NIR, characteristic of parched or fallow soil.',
          source: 'SatQuery RS-VLM',
          task: 'task_conf_opt',
          model_version: 'v0.1.0'
        },
        {
          id: 'ev_conf_02',
          type: 'Cross-modal',
          description: 'C-band SAR registers anomalous enhanced backscatter (+4.2 dB) across the western plots, indicating saturated sub-canopy water table or standing water beneath thin residue.',
          source: 'SatQuery Optical-SAR Fusion',
          task: 'task_conf_sar',
          model_version: 'v0.1.0'
        }
      ],
      confidence: {
        score: 0.584,
        label: 'MEDIUM',
        associated_model: 'Multi-Model Consensus Engine',
        task_type: 'Conflict Resolution',
        factors: ['Sensory disagreement between optical surface reflectance and microwave subsurface penetration']
      },
      conflicts: [
        {
          conflict_id: 'conf_spectral_vs_radar',
          conflict_type: 'Modality Semantic Disagreement',
          affected_tasks: ['task_conf_opt', 'task_conf_sar'],
          description: 'Optical RS-VLM identifies western sector as dry fallow soil due to low vegetative greenness (NDVI < 0.12), whereas Sentinel-1 SAR exhibits anomalous high backscatter indicative of saturated soil moisture and standing surface water beneath shallow canopy.',
          severity: 'HIGH'
        }
      ],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:31:00.090Z', details: 'Dual assessment mission received.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:31:00.220Z', details: 'Scheduled parallel optical and microwave pipelines.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:31:00.390Z', details: 'Rasters verified and compatible.' },
        { step: 'model_execution', status: 'completed', timestamp: '2026-09-15T07:31:02.180Z', details: 'Both specialist models completed execution.' },
        { step: 'conflict_detection', status: 'completed', timestamp: '2026-09-15T07:31:02.290Z', details: 'High-severity semantic discrepancy detected: Optical (Drought) vs SAR (Saturation).' },
        { step: 'confidence_calculation', status: 'completed', timestamp: '2026-09-15T07:31:02.340Z', details: 'Confidence attenuated from 0.94 to 0.584 (MEDIUM) due to unresolved sensor conflict.' },
        { step: 'investigation_completed', status: 'completed', timestamp: '2026-09-15T07:31:02.370Z', details: 'Discrepancy surfaced to operator with full audit trace.' }
      ]
    },
    finding: {
      summary: 'Sensor Discrepancy: Surface Drought vs Sub-Canopy Water Saturation',
      task_type: 'optical_sar',
      answer: 'Conflicting sensor signatures detected: Optical bands observe withered vegetation and bare dry topsoil, while Sentinel-1 microwave radar indicates high dielectric permittivity consistent with standing water or saturated soil beneath the upper crust.'
    },
    message: 'Investigation completed with active model conflict flagged'
  },

  // Scenario 8: Model failure
  scenario_model_fail: {
    investigation_id: 'inv_fail_9981',
    status: 'failed',
    query: 'Run dense 3D photogrammetric elevation reconstruction and sub-pixel edge vectorization.',
    created_at: '2026-09-15T07:34:00Z',
    tasks: [
      {
        task_id: 'task_dense_recon',
        task_type: 'dense_segmentation',
        image_ids: ['img_s2_optical_t1'],
        query: 'Run dense 3D photogrammetric elevation reconstruction and sub-pixel edge vectorization.',
        parameters: { mesh_resolution: 'sub_pixel', allocate_vram_gb: 16 },
        status: 'failed'
      }
    ],
    execution: {
      model_results: [
        {
          model_name: 'SatQuery 3D Reconstruction Engine',
          version: 'v0.1.0',
          task: 'Dense Elevation Mapping',
          description: 'Photogrammetric stereo and volumetric voxel solver',
          status: 'error',
          output: 'GPU Out of Memory (OOM): Allocated 11.2 GiB / Reserved 11.8 GiB. Dense mesh reconstruction requires 16.5 GiB for requested image tile.'
        }
      ],
      evidence: [],
      confidence: {
        score: 0.0,
        label: 'LOW',
        associated_model: 'SatQuery 3D Reconstruction Engine',
        task_type: 'Dense Elevation Mapping',
        factors: ['Inference halted due to backend hardware limit']
      },
      conflicts: [],
      compatibility: {
        compatible: true,
        reasons: []
      },
      trace: [
        { step: 'mission_received', status: 'completed', timestamp: '2026-09-15T07:34:00.080Z', details: 'High-compute 3D photogrammetry mission accepted.' },
        { step: 'plan_created', status: 'completed', timestamp: '2026-09-15T07:34:00.190Z', details: 'Pipeline provisioned for SatQuery 3D Engine.' },
        { step: 'plan_validation', status: 'completed', timestamp: '2026-09-15T07:34:00.220Z', details: 'Parameter limits verified.' },
        { step: 'raster_compatibility', status: 'completed', timestamp: '2026-09-15T07:34:00.320Z', details: 'Raster headers validated.' },
        { step: 'dependency_resolution', status: 'completed', timestamp: '2026-09-15T07:34:00.340Z', details: 'Allocated GPU context.' },
        { step: 'model_execution', status: 'failed', timestamp: '2026-09-15T07:34:01.890Z', details: 'Execution failed: GPU Out of Memory (OOM) during volumetric voxel allocation.' }
      ]
    },
    message: 'Specialist model execution failed: GPU Out of Memory during dense reconstruction.'
  }
};
