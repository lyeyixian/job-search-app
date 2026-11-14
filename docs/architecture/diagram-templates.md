# Diagram templates

Every diagram in this repo starts from one of the five templates on this page. Copy the template,
keep the `%%{init}%%` line and the `classDef` lines as they are, and change only the nodes and
arrows.

## Rules for all diagrams

- One diagram answers one question. Write that question as the sentence above the diagram.
- A heading names the diagram type and its subject, such as "Level 2: containers".
- A table below the diagram lists each element and its job, unless the diagram has fewer than four
  elements.
- A diagram is a Mermaid block in a markdown file. No image files.
- C4 and deployment diagrams are Mermaid flowcharts that run top to bottom, `flowchart TB`.
- Use the same name for a thing in every diagram, in the text and in the code.

### Node labels

Each node has three lines. Mermaid wraps a long line, and a wrapped box is hard to read, so each
line has a limit.

| Line | Content | Format | Limit |
|---|---|---|---|
| 1 | The name | Bold, `<b>` | 25 characters |
| 2 | The kind and the technology, in brackets | Normal | 28 characters |
| 3 | What it does | Small, `<small>` | 28 characters |

```text
"<b>Name</b><br/>[Kind: technology]<br/><small>What it does</small>"
```

- Do not put a `<br/>` inside a line. If the text does not fit, cut it. The table below the
  diagram holds the full description.
- Leave out the technology when there is none, as in `[Person]`.
- Write `[External: technology]` for a system outside ours.
- A subgraph has one line: the name, a comma, then the kind, as in `Home server, server`.

### Shapes and classes

| Element | Shape | Class | Look |
|---|---|---|---|
| Person | Stadium `([ ])` | `person` | Dark blue, white text |
| This system, on level 1 | Rectangle `[ ]` | `system` | Blue, white text |
| Container | Rectangle `[ ]` | `container` | Pale blue, dark text |
| Component | Rectangle `[ ]` | `component` | Pale blue, dark text |
| Data store | Cylinder `[( )]` | `store` | Pale blue, dark text |
| System or person outside ours | Rectangle, stadium or cylinder | `external` | Grey, dashed outline |
| Server, device or boundary | Subgraph | none | Light grey box |

### Theme

The first line of each flowchart is the `%%{init}%%` block from the templates. It sets the font,
the line colour, straight lines, and the light grey background of a subgraph. Sequence diagrams
use Mermaid's default look and have no `init` line.

### Arrows

| Meaning | Arrow | Label |
|---|---|---|
| A call or a request | Solid `-->` | A verb, then the protocol if it matters: `"git pull, SSH"` |
| A file mount, or data that one part is built from | Dotted `-.->` | A verb |
| No access | Dotted with a cross `-.-x` | `"no route"` |

Each arrow has a label of at most 20 characters. The arrow points from the part that starts the
action.

## Template 1: C4 level 1, system context

Question it answers: who uses the system, and which outside systems does it depend on?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    user(["<b>Person name</b><br/>[Person]<br/><small>What they do</small>"]):::person
    system["<b>System name</b><br/>[Software system]<br/><small>What it does</small>"]:::system
    ext[("<b>Outside system</b><br/>[External: technology]<br/><small>What it holds</small>")]:::external

    user -- "verb, protocol" --> system
    system -- "verb, protocol" --> ext

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
```

## Template 2: C4 level 2, containers

Question it answers: which parts that run or hold data make up the system, and how do they talk?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    user(["<b>Person name</b><br/>[Person]<br/><small>What they do</small>"]):::person

    subgraph system["System name"]
        app["<b>Container name</b><br/>[Container: technology]<br/><small>What it does</small>"]:::container
        db[("<b>Store name</b><br/>[Container: technology]<br/><small>What it holds</small>")]:::store
    end

    ext[("<b>Outside system</b><br/>[External: technology]<br/><small>What it holds</small>")]:::external

    user -- "verb, protocol" --> app
    app -- "verb, protocol" --> db
    app -- "verb, protocol" --> ext

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
```

## Template 3: C4 level 3, components

Question it answers: which parts make up one container, and which part may call which?

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph container["Container name"]
        subgraph groupA["Group name"]
            a["<b>Component name</b><br/>[Component: technology]<br/><small>What it does</small>"]:::component
        end
        subgraph groupB["Group name"]
            b["<b>Component name</b><br/>[Component: technology]<br/><small>What it does</small>"]:::component
        end
    end

    store[("<b>Store name</b><br/>[Container: technology]<br/><small>What it holds</small>")]:::store

    a -- "calls" --> b
    b -- "reads" --> store

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
```

## Template 4: deployment

Question it answers: on which machine does each container run, and what connects the machines?

A subgraph is a machine, a device or a service that runs things. Nest a subgraph for a runtime
inside its machine, such as Docker inside a server.

```mermaid
%%{init: {"theme":"base","themeVariables":{"fontFamily":"system-ui, sans-serif","fontSize":"14px","lineColor":"#57606a","clusterBkg":"#f6f8fa","clusterBorder":"#d0d7de","edgeLabelBackground":"#ffffff","primaryTextColor":"#1f2328"},"flowchart":{"curve":"linear","nodeSpacing":40,"rankSpacing":50}}}%%
flowchart TB
    subgraph device["Device name, device"]
        client["<b>Client name</b><br/>[Container: technology]<br/><small>What it does</small>"]:::container
    end

    subgraph server["Server name, server"]
        subgraph runtime["Runtime name, runtime"]
            app["<b>Container name</b><br/>[Container: technology]<br/><small>What it does</small>"]:::container
        end
        vol[("<b>Store name</b><br/>[Volume]<br/><small>What it holds</small>")]:::store
    end

    subgraph cloud["Service name, external service"]
        ext[("<b>Outside system</b><br/>[External]<br/><small>What it holds</small>")]:::external
    end

    client -- "verb, protocol" --> app
    vol -. "mounted" .-> app
    app -- "verb, protocol" --> ext

    classDef person fill:#0b3d6b,stroke:#0b3d6b,color:#ffffff,rx:8,ry:8
    classDef system fill:#1f6feb,stroke:#1a5fcc,color:#ffffff,rx:8,ry:8
    classDef container fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef component fill:#ddf4ff,stroke:#54aeff,color:#0a3069,rx:8,ry:8
    classDef store fill:#ddf4ff,stroke:#54aeff,color:#0a3069
    classDef external fill:#f6f8fa,stroke:#8c959f,color:#424a53,stroke-dasharray:4 3,rx:8,ry:8
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
