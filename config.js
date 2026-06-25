// Plik konfiguracyjny przewodnika.
// Edytuj, aby dodać etapy, języki i pliki mp3.
// Ścieżka pliku budowana jest jako: mp3_directory/<kod_języka>/<fileName>
// Pliki audio są dwujęzyczne (polski + język docelowy) i powstają skryptem generate.py.
const CONFIG = {
  mp3_directory: "audio",
  stages: [
    { id: "part-1", description: "Część 1" },
    { id: "part-2", description: "Część 2" },
    { id: "part-3", description: "Część 3" }
  ],
  languages: [
    {
      name: "Angielski", code: "en",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-en.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-en.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-en.mp3" }
      ]
    },
    {
      name: "Niemiecki", code: "de",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-de.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-de.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-de.mp3" }
      ]
    },
    {
      name: "Włoski", code: "it",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-it.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-it.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-it.mp3" }
      ]
    },
    {
      name: "Hiszpański", code: "es",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-es.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-es.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-es.mp3" }
      ]
    },
    {
      name: "Ukraiński", code: "uk",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-uk.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-uk.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-uk.mp3" }
      ]
    },
    {
      name: "Francuski", code: "fr",
      files: [
        { stageId: "part-1", fileName: "part-1-pl-fr.mp3" },
        { stageId: "part-2", fileName: "part-2-pl-fr.mp3" },
        { stageId: "part-3", fileName: "part-3-pl-fr.mp3" }
      ]
    }
  ]
};
