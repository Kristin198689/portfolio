"use client";

import dynamic from "next/dynamic";

// Heavy blocks far below the first screen. Their HTML is still rendered on the server (so search engines and
// people without JavaScript see everything), but their code is fetched as separate pieces after the first
// screen is alive, instead of being part of the first load.
export const UniverseLazy = dynamic(() => import("../universe/Universe").then((m) => m.Universe));
export const LabPreviewLazy = dynamic(() => import("./LabPreview").then((m) => m.LabPreview));
