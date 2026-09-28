# Frontend structure

The application code is organized by responsibility:

```text
Frontend/
|-- index.html             # public animated welcome screen
|-- pages/                 # application screens, including the home dashboard
|-- css/                   # shared site styling
|-- js/                    # shared and page-specific behaviour
`-- assets/                # images and the FITNESS logo
```

Root-level HTML files retained outside this layout are compatibility entry points that redirect into `pages/`. New pages, scripts, styles, and images should be added to the directories above.
