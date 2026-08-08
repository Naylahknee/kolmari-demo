// Kolmari — shared Food & Health dataset + helpers.
// Single source of truth for public/food.html and public/command-center.html.
// Exposes window.KolmariFood. Country data is editorial (see docs/food-filter-notes.md);
// confidence is uneven and shown per card — verify before allergy-critical decisions.
(function () {
  var ARCHETYPES = [
    { key: "mediterranean", label: "Mediterranean", desc: "Olive oil, fish, vegetables, legumes" },
    { key: "farm-to-table", label: "Farm-to-table", desc: "Fresh, local, seasonal produce" },
    { key: "seafood-forward", label: "Seafood-forward", desc: "Fish and shellfish are everyday staples" },
    { key: "plant-forward", label: "Plant-forward", desc: "Vegetables, grains and legumes lead the plate" },
    { key: "strict-allergen-labeling", label: "Strict allergen labeling", desc: "Packaged food must declare major allergens" },
    { key: "low-processed-food", label: "Low processed food", desc: "Cooking-from-scratch is the norm" },
    { key: "dairy-heavy", label: "Dairy-heavy", desc: "Cheese, yogurt and milk are central" },
    { key: "nut-heavy", label: "Nut-heavy", desc: "Peanuts or tree nuts run through everyday cooking" },
    { key: "high-processed-food", label: "High processed food", desc: "Packaged and fast food are widespread" },
  ];

  var ALLERGENS = [
    { key: "shellfish", label: "Shellfish" },
    { key: "treeNuts", label: "Tree nuts" },
    { key: "peanuts", label: "Peanuts" },
    { key: "dairy", label: "Dairy" },
    { key: "gluten", label: "Gluten" },
    { key: "eggs", label: "Eggs" },
  ];

  var EU_LAW = "EU Regulation 1169/2011 requires the 14 major allergens to be declared on packaged food and disclosed for non-prepacked food.";
  var EU_SRC = "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32011R1169";

  var COUNTRIES = [
    { name: "Portugal", slug: "portugal",
      archetypes: ["mediterranean","seafood-forward","farm-to-table","low-processed-food","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"rare", dairy:"occasional", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Olive-oil, fish and vegetable pattern is broadly heart-supportive; watch salt in bacalhau (salt cod) and pastries.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Spain", slug: "spain",
      archetypes: ["mediterranean","seafood-forward","farm-to-table","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"rare", dairy:"occasional", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Mediterranean base with olive oil and legumes is supportive; cured meats (jamón, chorizo) add sodium and saturated fat.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Greece", slug: "greece",
      archetypes: ["mediterranean","plant-forward","farm-to-table","low-processed-food","dairy-heavy","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"occasional", peanuts:"rare", dairy:"common", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Legumes, greens and olive oil are strong for heart health; feta and other cheeses carry salt.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Estonia", slug: "estonia",
      archetypes: ["farm-to-table","dairy-heavy","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"rare", treeNuts:"rare", peanuts:"rare", dairy:"common", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Rye bread, dairy and pork are central; leans heavier and less Mediterranean, so balance with fish and vegetables.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Croatia", slug: "croatia",
      archetypes: ["mediterranean","seafood-forward","farm-to-table","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"rare", dairy:"occasional", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Adriatic-coast cooking with fish, olive oil and vegetables is supportive; the continental interior is meatier.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Japan", slug: "japan",
      archetypes: ["seafood-forward","plant-forward","low-processed-food","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"occasional", dairy:"rare", gluten:"common", eggs:"common" },
      labelingLaw: { text: "Japan mandates allergen labeling on packaged food; from April 2026 the mandatory list is nine items (cashew added), with soy and sesame recommended." },
      cardioNote: "Fish, soy and vegetables with low dairy is heart-supportive; sodium runs high through soy sauce, miso and pickles.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "Netherlands", slug: "netherlands",
      archetypes: ["dairy-heavy","farm-to-table","strict-allergen-labeling","high-processed-food"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"occasional", peanuts:"occasional", dairy:"common", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: EU_LAW, sourceUrl: EU_SRC },
      cardioNote: "Strong food safety and labeling; cheese and butter make dairy and saturated fat easy to over-rely on. Peanut (pindakaas, Indo-Dutch dishes) is a regular presence.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "high" },

    { name: "South Korea", slug: "south-korea",
      archetypes: ["seafood-forward","plant-forward","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"occasional", dairy:"rare", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "South Korea (MFDS) requires allergen labeling on processed foods against an extensive national allergen list." },
      cardioNote: "Vegetables, fermented foods, soy and fish are supportive; sodium is high through kimchi, soy sauce and jang pastes.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "moderate" },

    { name: "Mexico", slug: "mexico",
      archetypes: ["plant-forward","farm-to-table","high-processed-food"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"occasional", peanuts:"occasional", dairy:"occasional", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "Packaged-food labeling (NOM-051) requires allergen declaration; enforcement and everyday-food practice vary." },
      cardioNote: "Beans, corn and vegetables form a supportive base; watch fried dishes, processed snacks and sodium. Peanuts appear in some moles and sauces.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "moderate" },

    { name: "Costa Rica", slug: "costa-rica",
      archetypes: ["plant-forward","farm-to-table","low-processed-food"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"rare", peanuts:"occasional", dairy:"occasional", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "General Central American / national labeling standards apply to packaged food; treat as a general picture, not statute-level verification." },
      cardioNote: "Rice, beans (gallo pinto), tropical fruit and vegetables are supportive and lightly processed.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "low" },

    { name: "Colombia", slug: "colombia",
      archetypes: ["farm-to-table","plant-forward"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"rare", peanuts:"occasional", dairy:"occasional", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "National packaged-food labeling rules require allergen information; verify current requirements before relying." },
      cardioNote: "Abundant fruit, vegetables and legumes are supportive; watch fried staples (empanadas, arepas with cheese) and added sugar.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "low" },

    { name: "Malaysia", slug: "malaysia",
      archetypes: ["seafood-forward","nut-heavy","plant-forward","high-processed-food"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"common", dairy:"rare", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "Food regulations require declaration of known allergens on labels; everyday street and restaurant food is a bigger exposure than labels." },
      cardioNote: "Fish, herbs and vegetables feature, but coconut milk adds saturated fat. Peanut is heavy (satay, sauces) — a real consideration for peanut allergy.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "moderate" },

    { name: "Thailand", slug: "thailand",
      archetypes: ["seafood-forward","nut-heavy","plant-forward","low-processed-food"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"common", dairy:"rare", gluten:"occasional", eggs:"common" },
      labelingLaw: { text: "Thai FDA requires allergen labeling on prepackaged food; fresh-cooked street food carries higher unlabeled exposure." },
      cardioNote: "Fresh herbs, vegetables and fish are supportive; coconut milk adds saturated fat and fish sauce adds sodium. Peanut is common.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "moderate" },

    { name: "Ghana", slug: "ghana",
      archetypes: ["plant-forward","nut-heavy","low-processed-food"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"rare", peanuts:"common", dairy:"rare", gluten:"occasional", eggs:"occasional" },
      labelingLaw: { text: "National food authority labeling applies to packaged goods; treat as a general picture, not statute-level verification." },
      cardioNote: "Plant-based stews, plantain, cassava and fish are wholesome; groundnut (peanut) soup and stews are staples — significant for peanut allergy. Watch palm oil and sodium.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "low" },

    { name: "Mauritius", slug: "mauritius",
      archetypes: ["seafood-forward","plant-forward","farm-to-table"],
      allergenPrevalence: { shellfish:"common", treeNuts:"occasional", peanuts:"occasional", dairy:"occasional", gluten:"occasional", eggs:"occasional" },
      labelingLaw: { text: "Packaged-food labeling standards apply; verify current allergen requirements before relying." },
      cardioNote: "Island fish, vegetable curries and legumes are supportive; watch oil and sugar in Creole and street dishes.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "low" },

    { name: "United Arab Emirates", slug: "uae",
      archetypes: ["high-processed-food","nut-heavy","dairy-heavy","strict-allergen-labeling"],
      allergenPrevalence: { shellfish:"occasional", treeNuts:"common", peanuts:"occasional", dairy:"occasional", gluten:"common", eggs:"occasional" },
      labelingLaw: { text: "Gulf (GSO) standards require allergen labeling on prepackaged food; the import-heavy, dining-out food culture is the larger exposure." },
      cardioNote: "Wide choice but rich meats, nuts/tahini and sweets are easy to over-rely on; dates and desserts add sugar. Tree nuts and sesame are frequent.",
      assessmentType: "kolmari-editorial", lastReviewed: "2026-08-08", confidence: "moderate" },
  ];

  // City / synonym → canonical country name, so a free-text Command Center
  // destination ("Lisbon", "CDMX", "Dubai") can resolve to a food profile.
  var ALIAS = {
    "portugal": "Portugal", "lisbon": "Portugal", "lisboa": "Portugal", "porto": "Portugal",
    "spain": "Spain", "madrid": "Spain", "barcelona": "Spain", "valencia": "Spain", "seville": "Spain",
    "greece": "Greece", "athens": "Greece", "thessaloniki": "Greece", "crete": "Greece",
    "estonia": "Estonia", "tallinn": "Estonia", "tartu": "Estonia",
    "croatia": "Croatia", "zagreb": "Croatia", "split": "Croatia", "dubrovnik": "Croatia",
    "japan": "Japan", "tokyo": "Japan", "osaka": "Japan", "kyoto": "Japan",
    "netherlands": "Netherlands", "the netherlands": "Netherlands", "holland": "Netherlands", "amsterdam": "Netherlands", "rotterdam": "Netherlands", "the hague": "Netherlands", "utrecht": "Netherlands",
    "south korea": "South Korea", "korea": "South Korea", "seoul": "South Korea", "busan": "South Korea",
    "mexico": "Mexico", "mexico city": "Mexico", "cdmx": "Mexico", "guadalajara": "Mexico", "monterrey": "Mexico", "merida": "Mexico",
    "costa rica": "Costa Rica", "san jose": "Costa Rica", "tamarindo": "Costa Rica",
    "colombia": "Colombia", "bogota": "Colombia", "medellin": "Colombia", "cali": "Colombia",
    "malaysia": "Malaysia", "kuala lumpur": "Malaysia", "penang": "Malaysia", "johor bahru": "Malaysia",
    "thailand": "Thailand", "bangkok": "Thailand", "chiang mai": "Thailand", "phuket": "Thailand",
    "ghana": "Ghana", "accra": "Ghana", "kumasi": "Ghana",
    "mauritius": "Mauritius", "port louis": "Mauritius",
    "uae": "United Arab Emirates", "u.a.e.": "United Arab Emirates", "united arab emirates": "United Arab Emirates", "emirates": "United Arab Emirates", "dubai": "United Arab Emirates", "abu dhabi": "United Arab Emirates",
  };

  var byName = {};
  COUNTRIES.forEach(function (c) { byName[c.name.toLowerCase()] = c; });

  function resolveCountry(name) {
    if (!name) return null;
    var q = String(name).trim().toLowerCase();
    if (byName[q]) return byName[q];
    if (ALIAS[q]) return byName[ALIAS[q].toLowerCase()] || null;
    // Loose contains match (e.g. "Portugal (Algarve)" or "moving to Japan").
    for (var i = 0; i < COUNTRIES.length; i++) {
      var n = COUNTRIES[i].name.toLowerCase();
      if (q.indexOf(n) !== -1 || n.indexOf(q) !== -1) return COUNTRIES[i];
    }
    for (var key in ALIAS) {
      if (ALIAS.hasOwnProperty(key) && q.indexOf(key) !== -1) return byName[ALIAS[key].toLowerCase()] || null;
    }
    return null;
  }

  function readFilter() {
    try {
      var f = JSON.parse(localStorage.getItem("kolmari:foodfilter") || "{}");
      return {
        archetypes: Array.isArray(f.archetypes) ? f.archetypes : [],
        allergens: Array.isArray(f.allergens) ? f.allergens : [],
      };
    } catch (e) {
      return { archetypes: [], allergens: [] };
    }
  }

  var archLabel = {};
  ARCHETYPES.forEach(function (a) { archLabel[a.key] = a.label; });
  var alrgLabel = {};
  ALLERGENS.forEach(function (a) { alrgLabel[a.key] = a.label; });

  window.KolmariFood = {
    ARCHETYPES: ARCHETYPES,
    ALLERGENS: ALLERGENS,
    COUNTRIES: COUNTRIES,
    archetypeLabel: function (k) { return archLabel[k] || k; },
    allergenLabel: function (k) { return alrgLabel[k] || k; },
    resolveCountry: resolveCountry,
    getFlaggedAllergens: function () { return readFilter().allergens; },
    getSelectedArchetypes: function () { return readFilter().archetypes; },
  };
})();
