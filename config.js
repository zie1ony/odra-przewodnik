// Plik konfiguracyjny przewodnika.
// Edytuj, aby dodać etapy, języki i pliki mp3 (katalog: mp3_directory).
const CONFIG = {
  accuracy_meters: 50,
  mp3_directory: "resources",
  stages: [
    {
      id: "etap-1",
      description: "Etap 1",
      coordinates: { lat: 52.2296756, lng: 21.0122287 }
    },
    {
      id: "etap-2",
      description: "Etap 2",
      coordinates: { lat: 52.406374, lng: 16.9251681 }
    }
  ],
  languages: [
    {
      name: "Polski", code: "pl",
      files: [
        { stageId: "etap-1", fileName: "etap-1-pl.mp3" },
        { stageId: "etap-2", fileName: "etap-2-pl.mp3" }
      ]
    },
    {
      name: "Angielski", code: "en",
      files: [
        { stageId: "etap-1", fileName: "etap-1-en.mp3" },
        { stageId: "etap-2", fileName: "etap-2-en.mp3" }
      ]
    },
    {
      name: "Niemiecki", code: "de",
      files: [
        { stageId: "etap-1", fileName: "etap-1-de.mp3" },
        { stageId: "etap-2", fileName: "etap-2-de.mp3" }
      ]
    }
  ]
};
