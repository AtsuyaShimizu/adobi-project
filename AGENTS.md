# AGENTS.md

## Communication Rules

Codexが作業する際のログ出力やサマリーなどは日本語で表示してください。

## Version
Angular v20

## Coding Rules

Please follow the rules below when writing code.

### 1. Boolean Variable Naming Conventions

Boolean variables should be named to represent a positive state or functionality when their value is `true`.

**Good Examples:**

* `isEnabled`
* `hasAccess`
* `isAvailable`

**Bad Examples:**

* `isDisabled` (represents a negative state when true)
* `hasNoAccess`
* `isUnavailable`

### 2. Frontend Architecture

The frontend file structure and responsibilities are as follows:

#### View Components (Under `View` Directory)

* Should be stateless components.
* Their responsibilities are limited to displaying received properties or data and emitting user interaction events.

#### Service Classes (Under `domain/service` Directory)

* Responsible for implementing business logic.
* Handle necessary operations between View components and State components.

#### State Classes (Under `domain/state` Directory)

* Dedicated to state management.
* State should be encapsulated and externally accessible only through read-only getter methods.
* Changes to state must always occur through defined methods.
* Methods changing the state should, in principle, only be invoked by Service components.

#### Page Components

* Act as container components.
* Responsible for mapping events emitted from View components to appropriate methods in Service classes.
* Retrieve state from State classes through Service classes and pass the state to View components.

### 3. Signal Declaration

* globalStateやlocalStateで使用するSignalは、`computed`などによる読み取り専用のケースを除き、`WritableSignal`で宣言してください。

### 4. Zone.js

本アプリケーションではZone.jsを利用しません。Angularアプリケーションはゾーン非依存の構成としてください。
