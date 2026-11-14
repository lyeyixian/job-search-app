# Diagram templates

Every diagram in this repo starts from one of the five templates on this page. Copy the template,
keep the `classDef` lines as they are, and change only the nodes and arrows.

## Rules for all diagrams

- One diagram answers one question. Write that question as the sentence above the diagram.
- A heading names the diagram type and its subject, such as "Level 2: containers".
- A table below the diagram lists each element and its job, unless the diagram has fewer than four
  elements.
- A diagram is a Mermaid block in a markdown file. No image files.
- C4 and deployment diagrams are Mermaid flowcharts that run top to bottom, `flowchart TB`.
- Use the same name for a thing in every diagram, in the text and in the code.

### Node labels

Each node has three lines.

```text
Name
[Kind: technology]
What it does, in a few words
```

Leave out the technology when there is none, as in `[Person]`.

### Shapes and classes

| Element | Shape | Class | Colour |
|---|---|---|---|
| Person | Stadium `([ ])` | `person` | Dark blue |
| This system, on level 1 | Rectangle `[ ]` | `system` | Blue |
| Container | Rectangle `[ ]` | `container` | Mid blue |
| Component | Rectangle `[ ]` | `component` | Light blue |
| Data store | Cylinder `[( )]` | `store` | Mid blue |
| System or person outside ours | Rectangle or stadium | `external` | Grey |
| Server or device, in deployment | Subgraph | none | Default |
| Boundary of a system or container | Subgraph | none | Default |

### Arrows

| Meaning | Arrow | Label |
|---|---|---|
| A call or a request | Solid `-->` | A verb, then the protocol: `"reads notes, HTTPS"` |
| A file mount, or data that one part is built from | Dotted `-.->` | A verb |
| No access | Dotted with a cross `-.-x` | `"no route"` |

Each arrow has a label. The arrow points from the part that starts the action.

## Template 1: C4 level 1, system context

Question it answers: who uses the system, and which outside systems does it depend on?

```mermaid
flowchart TB
    user(["Person name<br/>[Person]<br/>What they do"]):::person
    system["System name<br/>[Software system]<br/>What it does"]:::system
    ext[("Outside system<br/>[External system: technology]<br/>What it holds")]:::external

    user -- "does something, protocol" --> system
    system -- "does something, protocol" --> ext

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
```

## Template 2: C4 level 2, containers

Question it answers: which parts that run or hold data make up the system, and how do they talk?

```mermaid
flowchart TB
    user(["Person name<br/>[Person]<br/>What they do"]):::person

    subgraph system["System name"]
        app["Container name<br/>[Container: technology]<br/>What it does"]:::container
        db[("Store name<br/>[Container: technology]<br/>What it holds")]:::store
    end

    ext[("Outside system<br/>[External system: technology]<br/>What it holds")]:::external

    user -- "does something, protocol" --> app
    app -- "reads and writes, protocol" --> db
    app -- "does something, protocol" --> ext

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
```

## Template 3: C4 level 3, components

Question it answers: which parts make up one container, and which part may call which?

```mermaid
flowchart TB
    subgraph container["Container name"]
        subgraph groupA["Group name"]
            a["Component name<br/>[Component: technology]<br/>What it does"]:::component
        end
        subgraph groupB["Group name"]
            b["Component name<br/>[Component: technology]<br/>What it does"]:::component
        end
    end

    store[("Store name<br/>[Container: technology]<br/>What it holds")]:::store

    a -- "calls" --> b
    b -- "reads" --> store

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
```

## Template 4: deployment

Question it answers: on which machine does each container run, and what connects the machines?

A subgraph is a machine, a device or a service that runs things. Nest a subgraph for a runtime
inside its machine, such as Docker inside a server.

```mermaid
flowchart TB
    subgraph device["Device name<br/>[Device]"]
        client["Client name<br/>[Container: technology]<br/>What it does"]:::container
    end

    subgraph server["Server name<br/>[Server: operating system]"]
        subgraph runtime["Runtime name<br/>[Runtime]"]
            app["Container name<br/>[Container: technology]<br/>What it does"]:::container
        end
        vol[("Store name<br/>[Volume]<br/>What it holds")]:::store
    end

    subgraph cloud["Service name<br/>[External service]"]
        ext[("Outside system<br/>[External system]<br/>What it holds")]:::external
    end

    client -- "does something, protocol and port" --> app
    vol -. "mounted at a path" .-> app
    app -- "does something, protocol" --> ext

    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    classDef system fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef container fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef component fill:#85bbf0,stroke:#5d82a8,color:#000000
    classDef store fill:#438dd5,stroke:#2e6295,color:#ffffff
    classDef external fill:#999999,stroke:#6b6b6b,color:#ffffff
```

## Template 5: sequence

Question it answers: what happens, in order, when one thing occurs?

- The person or the system that starts the flow is the first participant, as an `actor`.
- The participants are containers or components from the C4 diagrams, with the same names.
- `autonumber` is on.
- A solid arrow `->>` is a call. A dashed arrow `-->>` is its answer.
- Each way the flow can fail is a branch of an `alt` block, with the failure first.

```mermaid
sequenceDiagram
    autonumber
    actor User as Person name
    participant A as Component name
    participant B as Component name

    User->>A: does something
    A->>B: asks for something
    alt the call fails
        B-->>A: error
        A-->>User: what the person sees
    else the call works
        B-->>A: result
        A-->>User: what the person sees
    end
```
