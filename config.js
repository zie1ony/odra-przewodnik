// Plik konfiguracyjny przewodnika.
// Edytuj, aby dodać etapy, języki i pliki mp3.
// Ścieżka pliku budowana jest jako: mp3_directory/<kod_języka>/<fileName>
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
    },
    {
      id: "etap-3",
      description: "Etap 3",
      // TODO: uzupełnić właściwe koordynaty etapu 3
      coordinates: { lat: 51.1078852, lng: 17.0385376 }
    }
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
