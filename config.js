// Plik konfiguracyjny przewodnika.
// Edytuj, aby dodać etapy, języki i pliki mp3.
// Ścieżka pliku budowana jest jako: mp3_directory/<kod_języka>/<fileName>
const CONFIG = {
  mp3_directory: "resources",
  stages: [
    { id: "etap-1", description: "Etap 1" },
    { id: "etap-2", description: "Etap 2" },
    { id: "etap-3", description: "Etap 3" }
  ],
  languages: [
    {
      name: "Angielski", code: "en",
      files: [
        { stageId: "etap-1", fileName: "part-1-en.mp3" },
        { stageId: "etap-2", fileName: "part-2-en.mp3" },
        { stageId: "etap-3", fileName: "part-3-en.mp3" }
      ]
    },
    {
      name: "Niemiecki", code: "de",
      files: [
        { stageId: "etap-1", fileName: "etap-1-de.mp3" },
        { stageId: "etap-2", fileName: "etap-2-de.mp3" },
        { stageId: "etap-3", fileName: "etap-3-de.mp3" }
      ]
    }
  ]
};
