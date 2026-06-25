# Odra Przewodnik

NOTE: AI nie może edytować tego pliku!

Odra Przewodnik to strona internetowa, która będzie uruchomiona w Google Chrome
na Androidzie.

Głównym celem jest uruchamianie wgranych plików mp3 w oparciu o koordynaty GPS. Strona będzie działać w trybie offline, więc nie będzie wymagała połączenia z internetem po pierwszym uruchomieniu.

System będzie monitorował aktualne położenie GPS użytkownika i automatycznie odtwarzał pliki mp3, gdy użytkownik znajdzie się w określonych koordynatach. 

Dodatkowo użytkownik może wybrać i zmienić język w dowolnym momencie.

Uzytkownik widzi listę etapów i może wybrać co chce odtworzyć ręcznie.

Użytkownik widzi przycisk do włącznia i wyłączenia automatycznego odtwarzania na podstawie GPS, klikając w etap ręcznie automatyczne odtwarzanie zostaje wyłączone.

Użytkownik widzi co teraz jest odtwarzane i może w każdej chwili zatrzymać odtwarzanie.

Użytkownik ma przycisk ">|" do przewinięcia do następnego etapu.

Jeśli w trakcie odtwarzania użytkownik znajdzie się w polu następnego pliku mp3, to ten zostaje zakolejkowany. Przejście do trybu ręcznego czyści kolejkę.

Użytkownik widzi czasy plików mp3 i może przewinąć do dowolnego momentu w pliku.

Włączenie ręcznie wybranego pliku powoduje wyłącznie innego pliku, który jest aktualnie odtwarzany.

## Plik konfiguracyjny

```
{
    accuracy_meters: 50,
    mp3_directory: "resources",
    stages: [
        {
            id: "etap-1",
            description: "Etap 1",
            coordinates: {
                lat: 52.2296756,
                lng: 21.0122287
            },
        },
        {
            id: "etap-2",
            description: "Etap 2",
            coordinates: {
                lat: 52.406374,
                lng: 16.9251681
            },
        }
    ]

    languages: [
        {
            name: "Polski",
            code: "pl",
            files: [
                {
                    stageId: "etap-1",
                    fileName: "etap-1-pl.mp3"
                },
                {
                    stageId: "etap-2",
                    fileName: "etap-2-pl.mp3"
                }
            ]
        },
        {
            name: "Angielski",
            code: "en",
            files: [
                {
                    stageId: "etap-1",
                    fileName: "etap-1-en.mp3"
                },
                {
                    stageId: "etap-2",
                    fileName: "etap-2-en.mp3"
                }
            ]
        },
        {
            name: "Niemiecki",
            code: "de",
            files: [
                {
                    stageId: "etap-1",
                    fileName: "etap-1-de.mp3"
                },
                {
                    stageId: "etap-2",
                    fileName: "etap-2-de.mp3"
                }
            ]
        }
    ],
}
