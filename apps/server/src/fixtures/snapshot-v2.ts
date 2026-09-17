// Captured from the v0.3 engine at commit 66472ae; do not regenerate with v0.4.
export const snapshotV2: unknown = {
  "schemaVersion": 2,
  "gameId": "legacy-v2",
  "version": 0,
  "seed": 42,
  "rng": {
    "algorithm": "mulberry32-v1",
    "state": 42
  },
  "status": "ACTIVE",
  "playerCount": 2,
  "players": [
    {
      "id": "p1",
      "name": "Legacy One",
      "civilization": {
        "id": "civilization-1",
        "ownerId": "p1",
        "cities": [
          {
            "id": "legacy-capital",
            "ownerId": "p1",
            "hexId": "0,0",
            "name": "Legacy Capital",
            "population": 2,
            "stability": 60,
            "development": 1,
            "specialization": null,
            "workers": {
              "producers": 0,
              "artisans": 0,
              "merchants": 0,
              "scholars": 0,
              "soldiers": 0,
              "unassigned": 2
            },
            "foundedRound": 1,
            "growthProgress": 0
          }
        ],
        "capitalCityId": "legacy-capital",
        "government": "PROTO_GOVERNANCE",
        "administrativeCapacity": 3,
        "administrativeLoad": 1,
        "administrationStatus": "WITHIN_CAPACITY"
      },
      "resources": {
        "food": 0,
        "materials": 0,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      }
    },
    {
      "id": "p2",
      "name": "Legacy Two",
      "civilization": {
        "id": "civilization-2",
        "ownerId": "p2",
        "cities": [],
        "capitalCityId": null,
        "government": "PROTO_GOVERNANCE",
        "administrativeCapacity": 3,
        "administrativeLoad": 0,
        "administrationStatus": "WITHIN_CAPACITY"
      },
      "resources": {
        "food": 0,
        "materials": 0,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      }
    }
  ],
  "map": [
    {
      "id": "0,0",
      "q": 0,
      "r": 0
    }
  ],
  "round": 1,
  "era": "FOUNDATION",
  "phase": "MAINTENANCE",
  "config": {
    "baseCommandPoints": 4,
    "foodPerPopulation": 1,
    "growthThreshold": 10,
    "maxGrowthPerMaintenance": 1,
    "initialPopulation": 2,
    "initialStability": 60,
    "maxDevelopment": 5,
    "developmentPopulationCaps": [
      3,
      5,
      8,
      12,
      16
    ],
    "developmentCosts": [
      {
        "food": 0,
        "materials": 5,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      },
      {
        "food": 0,
        "materials": 10,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      },
      {
        "food": 0,
        "materials": 15,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      },
      {
        "food": 0,
        "materials": 20,
        "wealth": 0,
        "knowledge": 0,
        "influence": 0
      }
    ],
    "specializationMinimumDevelopment": 1,
    "productionPerWorker": {
      "producers": 2,
      "artisans": 1,
      "merchants": 1,
      "scholars": 1
    },
    "specializationModifiers": {
      "AGRARIAN": {
        "producerBonus": 1,
        "artisanBonus": 0,
        "merchantBonus": 0,
        "scholarBonus": 0,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 0
      },
      "COMMERCIAL": {
        "producerBonus": 0,
        "artisanBonus": 0,
        "merchantBonus": 1,
        "scholarBonus": 0,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 0
      },
      "ACADEMIC": {
        "producerBonus": 0,
        "artisanBonus": 0,
        "merchantBonus": 0,
        "scholarBonus": 1,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 0
      },
      "ADMINISTRATIVE": {
        "producerBonus": 0,
        "artisanBonus": 0,
        "merchantBonus": 0,
        "scholarBonus": 0,
        "administrativeCapacity": 2,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 0
      },
      "MILITARY": {
        "producerBonus": 0,
        "artisanBonus": 0,
        "merchantBonus": 0,
        "scholarBonus": 0,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 1,
        "futureInfluenceBonus": 0
      },
      "INDUSTRIAL": {
        "producerBonus": 0,
        "artisanBonus": 1,
        "merchantBonus": 0,
        "scholarBonus": 0,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 0
      },
      "CULTURAL": {
        "producerBonus": 0,
        "artisanBonus": 0,
        "merchantBonus": 0,
        "scholarBonus": 0,
        "administrativeCapacity": 0,
        "futureRecruitmentPreparation": 0,
        "futureInfluenceBonus": 1
      }
    },
    "governmentModifiers": {
      "PROTO_GOVERNANCE": {
        "capacityFlat": 0,
        "capacityPerCity": 0,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 0,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 0,
        "capitalStability": 0,
        "developedCityStability": 0,
        "developedMinLevel": 3,
        "globalStability": 0,
        "multiCityStability": 0,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 0,
        "commercialWealthBonusPercent": 0,
        "commandPointsDelta": 0,
        "futureKnowledgeBonusPercent": 0,
        "futureInfluenceBonusPercent": 0,
        "futureInequalityStabilityPenalty": 0,
        "futureReformFlexibilityPenalty": 0
      },
      "MONARCHY": {
        "capacityFlat": 2,
        "capacityPerCity": 0,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 0,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 5,
        "capitalStability": 3,
        "developedCityStability": 0,
        "developedMinLevel": 3,
        "globalStability": 0,
        "multiCityStability": 0,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 0,
        "commercialWealthBonusPercent": 0,
        "commandPointsDelta": 0,
        "futureKnowledgeBonusPercent": 0,
        "futureInfluenceBonusPercent": 0,
        "futureInequalityStabilityPenalty": 0,
        "futureReformFlexibilityPenalty": 0
      },
      "REPUBLIC": {
        "capacityFlat": 0,
        "capacityPerCity": 0,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 1,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 0,
        "capitalStability": 0,
        "developedCityStability": 2,
        "developedMinLevel": 3,
        "globalStability": 0,
        "multiCityStability": 0,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 0,
        "commercialWealthBonusPercent": 0,
        "commandPointsDelta": 0,
        "futureKnowledgeBonusPercent": 10,
        "futureInfluenceBonusPercent": 10,
        "futureInequalityStabilityPenalty": 0,
        "futureReformFlexibilityPenalty": 0
      },
      "OLIGARCHY": {
        "capacityFlat": 0,
        "capacityPerCity": 0,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 0,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 0,
        "capitalStability": 0,
        "developedCityStability": 0,
        "developedMinLevel": 3,
        "globalStability": 0,
        "multiCityStability": 0,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 10,
        "commercialWealthBonusPercent": 15,
        "commandPointsDelta": 0,
        "futureKnowledgeBonusPercent": 0,
        "futureInfluenceBonusPercent": 0,
        "futureInequalityStabilityPenalty": 2,
        "futureReformFlexibilityPenalty": 0
      },
      "THEOCRACY": {
        "capacityFlat": 0,
        "capacityPerCity": 0,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 0,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 0,
        "capitalStability": 0,
        "developedCityStability": 0,
        "developedMinLevel": 3,
        "globalStability": 2,
        "multiCityStability": 0,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 0,
        "commercialWealthBonusPercent": 0,
        "commandPointsDelta": 0,
        "futureKnowledgeBonusPercent": 0,
        "futureInfluenceBonusPercent": 10,
        "futureInequalityStabilityPenalty": 0,
        "futureReformFlexibilityPenalty": 1
      },
      "CONFEDERATION": {
        "capacityFlat": 0,
        "capacityPerCity": 1,
        "unstableBelow": 40,
        "unstableCityCapacityPenalty": 0,
        "capitalCrisisBelow": 20,
        "capitalCrisisPenalty": 0,
        "capitalStability": 0,
        "developedCityStability": 0,
        "developedMinLevel": 3,
        "globalStability": 0,
        "multiCityStability": 2,
        "multiCityMinimum": 2,
        "wealthBonusPercent": 0,
        "commercialWealthBonusPercent": 0,
        "commandPointsDelta": -1,
        "futureKnowledgeBonusPercent": 0,
        "futureInfluenceBonusPercent": 0,
        "futureInequalityStabilityPenalty": 0,
        "futureReformFlexibilityPenalty": 0
      }
    },
    "administrativeRules": {
      "baseCapacity": 3,
      "loadPerCity": 1,
      "developmentStep": 2,
      "populationStep": 5,
      "overextensionStabilityPenalty": 3,
      "overextensionEconomicPercent": 90
    },
    "stabilityThresholds": {
      "criticalMax": 19,
      "unstableMax": 39,
      "tenseMax": 59,
      "stableMax": 79
    },
    "stabilityProductionPercent": {
      "CRITICAL": 75,
      "UNSTABLE": 90,
      "TENSE": 100,
      "STABLE": 100,
      "PROSPEROUS": 110
    },
    "blockDevelopmentAtCritical": true,
    "shortageStabilityPenalty": 5
  },
  "pendingOrders": {
    "p1": [],
    "p2": []
  },
  "eventLog": [
    {
      "version": 0,
      "round": 1,
      "type": "GAME_CREATED"
    }
  ]
};
