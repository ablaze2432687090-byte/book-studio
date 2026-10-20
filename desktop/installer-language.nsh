; Seed a fresh application's language without replacing existing preferences.
!macro customInstall
  CreateDirectory "$APPDATA\BookStudio"
  FileOpen $0 "$APPDATA\BookStudio\installer-language.txt" w
  StrCmp $LANGUAGE 1033 0 +3
    FileWrite $0 "en"
    Goto +2
    FileWrite $0 "zh-CN"
  FileClose $0
!macroend
