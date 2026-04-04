# Changelog

## [1.1.0](https://github.com/zouzonghua/zhtrans/compare/zhtrans-v1.0.0...zhtrans-v1.1.0) (2026-04-04)


### Features

* Add comprehensive architecture documentation, implement Clean Architecture principles, and establish a clear directory structure for the project. ([fa92aff](https://github.com/zouzonghua/zhtrans/commit/fa92aff283ee5f158b5b2048b37bd10d61b1fe78))
* Add manifest version update plugin to Vite configuration and change version in manifest.json to 1.0.0 ([ee9b9ac](https://github.com/zouzonghua/zhtrans/commit/ee9b9ac57f9c0672532177ea13a46305a6babbe9))
* add release-please release workflow ([3c4611b](https://github.com/zouzonghua/zhtrans/commit/3c4611bdfd61199b40e3a9a7c839fc5e9872d52e))
* add release-please release workflow ([c8e138d](https://github.com/zouzonghua/zhtrans/commit/c8e138df16aece428601f3f72432180d439820b9))
* Add search functionality to the history list, allowing users to filter translation entries. ([6383866](https://github.com/zouzonghua/zhtrans/commit/638386698548cde882817a7e4b6be66f2b76a1dc))
* Add speaking indicator and stop/start functionality for text-to-speech, extracting styles to a dedicated CSS file. ([9fefb4a](https://github.com/zouzonghua/zhtrans/commit/9fefb4a1877d958c730075482bf5701d29f7b175))
* Add unit tests for HistoryUseCase and SpeakTextUseCase, validating core functionalities and error handling mechanisms. ([b2e22f9](https://github.com/zouzonghua/zhtrans/commit/b2e22f91364b05728b8118d669e279333eac9de6))
* add vite/client to tsconfig types for improved type inference. ([a43bc2e](https://github.com/zouzonghua/zhtrans/commit/a43bc2eed1aa32840caf11b27d91b1449da09962))
* Conditionally hide phonetics for long texts in the translation UI to improve readability and add `chrome` types to tsconfig. ([5e5347d](https://github.com/zouzonghua/zhtrans/commit/5e5347d14adc844af4289f970184ebac8f778d9a))
* Enhance HistoryViewModel and LookupViewModel with detailed architecture documentation, constructor parameter descriptions, and improved observer pattern implementation for better state management and testability. ([55f6975](https://github.com/zouzonghua/zhtrans/commit/55f6975120dc75e23a57a24c06d960865f74c146))
* Enhance keyboard shortcuts for translation and speech functionality in GlimpseViewModel ([1260e60](https://github.com/zouzonghua/zhtrans/commit/1260e6049bae8fc5b14e6acf3286750da469a747))
* Enhance translation functionality by introducing translation types for lookup and subtitle, implementing caching indicators, and refining UI components for improved user experience and modularity. ([8183d0d](https://github.com/zouzonghua/zhtrans/commit/8183d0d07c1415f1106ea67f35ad88a142661bbf))
* Enhance unit tests for HistoryUseCase and LookupUseCase by adding translation types and pagination methods, improving test coverage and functionality validation. ([d59eeec](https://github.com/zouzonghua/zhtrans/commit/d59eeecf83e968fb6ad19b73b119b4f481622d35))
* Enhance YouTube subtitle display and data management. ([e05ec60](https://github.com/zouzonghua/zhtrans/commit/e05ec60ce5a3fb0aefeeb984f6e42e9f1935e96e))
* Implement dark mode and theme management using CSS variables. ([1e53a93](https://github.com/zouzonghua/zhtrans/commit/1e53a931790a86ac9dc175774481b386274a586b))
* Implement error handling with retry for translations, improve dynamic popup positioning, and enhance translation request robustness with request ID tracking. ([4d39249](https://github.com/zouzonghua/zhtrans/commit/4d392498392bf7d7c2e84a4cf4af29e16bd6d144))
* Implement History and Lookup use cases with corresponding view models and UI components, enhancing the architecture for better state management and separation of concerns. ([c5def06](https://github.com/zouzonghua/zhtrans/commit/c5def063a8efd886b2f5993a2f57e01b3b24616c))
* implement infinite scrolling with pagination and scroll-to-top for history list ([f01abe8](https://github.com/zouzonghua/zhtrans/commit/f01abe8cc9f7f0cada222d04f9ad417245adb19e))
* Implement the core Glimpse Chrome extension with translation functionality and a custom Shadow DOM UI. ([7098b9a](https://github.com/zouzonghua/zhtrans/commit/7098b9a02a3c20684b52a26ae22fb5fd67469899))
* Implement translation caching with `chrome.storage.local` and add a loading indicator to the lookup trigger. ([8c87993](https://github.com/zouzonghua/zhtrans/commit/8c879933f228fb4954306f4e61962d02f98d5a25))
* Implement translation history feature with popup UI, add caching functionality, and enhance build scripts for improved development workflow ([ba69617](https://github.com/zouzonghua/zhtrans/commit/ba6961771c15272e1359cdc9782b80e29d2e5ab1))
* Implement YouTube subtitle translation feature with real-time updates, dual caching mechanism, and Tailwind CSS for consistent styling across platforms. Enhance architecture with dedicated components and hooks for improved modularity and maintainability. ([b517433](https://github.com/zouzonghua/zhtrans/commit/b51743391284e39dcb7c1bcf582747c1c1e12649))
* Integrate Tailwind CSS for styling, refactor existing CSS to use utility classes, and correct popup tail direction logic. ([203b6a4](https://github.com/zouzonghua/zhtrans/commit/203b6a4f9410a5584b4412405d784ac96a573c78))
* Introduce `useGlimpseModel` to centralize application logic, add keyboard shortcut translation, and enhance loading state display. ([aff9da1](https://github.com/zouzonghua/zhtrans/commit/aff9da1b0c85e0d4f2b53f1c60e7a7251f9e9fa0))
* Introduce SpeakTextUseCase for text-to-speech functionality, refactor existing use cases to utilize the new class, and update UI components for seamless integration. ([48efbbb](https://github.com/zouzonghua/zhtrans/commit/48efbbb6468bdd412aca68847d3b4248f30868f4))
* Refactor content structure by organizing components into subdirectories, introduce new constants for popup dimensions, and implement dedicated hooks for dismissal and selection handling, enhancing modularity and maintainability. ([6de32d0](https://github.com/zouzonghua/zhtrans/commit/6de32d098f31acecec57ff67c771b139c5f2b70e))
* Rename project from Glimpse to LinxTrans, update related components and styles, and introduce LinxTransViewModel for state management ([d6cabcc](https://github.com/zouzonghua/zhtrans/commit/d6cabccabbb6191c498f8bcfd4223d5708e928c9))
* Rewrite the user interface using Preact components and JSX. ([cccbda3](https://github.com/zouzonghua/zhtrans/commit/cccbda39ec2551edb7f54890ef9724998ecc20ee))
* update HistoryViewModel to enhance history data management and presentation logic. ([b308391](https://github.com/zouzonghua/zhtrans/commit/b308391697155bf49978106533d2f23e331fb980))
* Update project name to LinxTrans, modify related files, and add new icons for improved branding ([d9dbaf8](https://github.com/zouzonghua/zhtrans/commit/d9dbaf84ab2289724318b0f5c8765cd919e249f2))


### Bug Fixes

* cancel pending dismissal in `useDismissal` hook when a new trigger is active and add corresponding tests with `jsdom`. ([eb384ac](https://github.com/zouzonghua/zhtrans/commit/eb384ac166bde7450e66cf8f8d93b1f0f0f2a815))

## Changelog

All notable changes to this project will be documented in this file.
