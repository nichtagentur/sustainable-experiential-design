---
slug: designing-for-disassembly-workflow
title: "Designing for Disassembly: A Five-Step Workflow for Truly Reusable Installations"
description: "The practical workflow I use to make experiential installations end well — modular dimensioning, mechanical-only fasteners, material passports, and a disassembly rehearsal before the show closes."
date: 2026-05-06
author: philipp-blume
hero: hero-disassembly.webp
hero_alt: "An exploded axonometric drawing of a modular installation with arrows showing how panels separate from a steel scaffold frame."
tags:
  - design for disassembly
  - circular design
  - exhibition design
  - workflow
---

# Designing for Disassembly

The first time I built an installation I cared about, in 2014, I put it together with hot-melt glue and a staple gun. It was an angular paper-origami stage — the [LIVING PAPER](https://github.com/nichtagentur/living-paper-video) sculpture at Republic Salzburg — and it looked exactly the way I wanted it to. After the show it was unbuildable. Most of it went into a skip behind the venue. The cardboard could have been recycled if I had taken it apart cleanly; the glue and staples meant the venue's recycling contractor sent it to incineration.

That is the gap I have been working on closing for the last decade. A truly reusable installation is not made by choosing greener materials. It is made by writing down, from day one, exactly how the thing comes apart and where each piece goes next. Materials are an inputs problem; reusability is a workflow problem.

Below is the five-step workflow I now use on every project where the brief allows it. It is short on theory and long on the small decisions that actually matter — the ones that, if you skip them at the design table, you cannot recover from on the dismount.

## Step 1: Specify the after-life on day one of the brief

Before I touch a 3D modeller, I write three sentences on the project brief:

1. **Where does each material go after the show?** ("Cardboard skins → paper recycler at the venue. Steel frame → returned to AluKit GmbH rental pool. Mycelium acoustic panels → composted on-site, certificate of compost from venue gardener.")
2. **Who picks it up?** Name, phone number, day-of-week.
3. **What documentation accompanies each item?** ("Material passport CSV uploaded to Madaster the day before strike.")

These three sentences become my "definition of done" for the project. They go in the Statement of Work to the client. They are budgeted for, the same way fabrication is budgeted for. If the answer to question 2 is "we don't know yet", the project is not ready to go into production, and I push back on the timeline.

This sounds bureaucratic. It is the single highest-leverage change I have made in a decade of practice. The reason most installations end in a landfill is not because designers don't care — it is because nobody on the team has been given the explicit responsibility to think about the after-life until the venue starts asking when the truck arrives. By then the only economical option is "into the skip".

## Step 2: Dimension everything to a transportable, reusable module

Here is the mistake I see most often: a designer draws a beautiful 3.7 m wide wall panel because that is what the installation visually wants, and then spends the build week splitting it because nothing larger than 2.4 m fits through the venue door. The panel ends up cut into pieces that are too irregular to ship, store or reuse.

The fix is to pick a module dimension at the start of design and refuse to break it. The two grids I use, depending on context:

- **Eurolog grid: 1200 × 800 × ≤ 2200 mm.** This is the footprint of a Euro-pallet with a clearance height that fits in a standard event truck and a sliding-door storage unit. Every panel, every truss section, every prop sub-assembly is designed to land on a 1200 × 800 base when broken down. After the show, the entire installation rolls onto pallets and into a 33 m³ truck without any cutting.

- **Octanorm grid: 992 × 992 mm column spacing, 1006, 1486, 1976 mm panel widths.** When I am designing into a trade-fair context, I follow Octanorm or Aluvision dimensions even if the installation is bespoke — because the venue floors, the rented walling, and the truss systems are all based on these grids. Snapping to them lets components from one show drop into another show.

The discipline of "the module wins" is a creative constraint, not a creative compromise. The 2014 origami stage was beautiful and unique because I was inventing every panel; almost none of those panels could be reused for anything because almost none of them shared a dimension. If I rebuilt that show today, I would design the origami language onto a 1200 × 800 cardboard base unit. The visual would be 90% as striking, and the after-life would be 100% better.

## Step 3: No glue, no staples, no spray adhesive. Mechanical fasteners only.

The single technical commitment that makes everything else possible is this: every connection in the installation must be reversible by hand within ten minutes per square metre.

Practically, that means:

- **Bolted connections** (M5–M8) with captive nuts where the panel will be stressed. Use a thread-locking compound, not a glue. A drop of Loctite blue holds against vibration and still releases under torque; a smear of two-part epoxy does not.
- **Hook-and-loop and dovetail joinery** for non-load-bearing skins, especially textile and cardboard. The cardboard skin on a recent gallery install was held to the steel frame with 25 mm wide hook-and-loop tape — the same tape we used at the 2025 install will be used again at the 2026 install.
- **Magnetic connections** for graphics panels under 5 kg that need to be swapped during a run. Neodymium magnets in countersunk pockets, on a steel sub-frame.
- **Knock-down hardware** from the kitchen-cabinet world (cam-locks, eccentric fasteners) for repeated assembly/disassembly. A 16 mm cam-lock survives ~300 cycles in my experience; a screw into chipboard survives about 5.

The two materials that should not exist in your installation: **hot-melt glue** and **spray adhesive**. Both contaminate everything they touch and convert recyclable materials into landfill. The temptation to use them on the build day is enormous. Pre-empt it by ordering them out of the build kit.

I now run a "no-glue audit" the morning before the install opens. I walk the show with the head of fabrication, point at every joint, and ask "how does this come apart?" If the answer is "we'll have to break it", the joint goes back to the drawing board.

## Step 4: Issue a material passport for everything that leaves the workshop

A material passport is a document that travels with a component for its entire life. At minimum it lists:

- **What the component is** (panel ID, geometry, weight, batch).
- **What it is made of** (substrate, skin, fasteners, finishes, coatings).
- **Who made it and from what stock** (vendor, lot number, manufacture date).
- **What its known end-of-life paths are** (recycling stream, composting, reuse partner).
- **Any contamination risk** (FR coating chemistry, adhesive type, paint VOC class).

I keep these in a CSV inside the project repository, one row per component. For projects with more than ~50 components or a long expected service life, I upload them to [Madaster](https://madaster.com/), a platform whose only job is to keep material passports queryable and traceable across the building's life.

The reason this matters more than it sounds: at strike, the recycling contractor needs to know, in three seconds, which bin a panel goes into. Without a passport, the contractor's default is "general waste". With a passport stuck to the back of every panel as a small QR-coded label, the right bin is identified before the panel hits the floor. The cost of producing the labels is about €0.04 per component. The cost of getting it wrong is the entire show going to incineration.

## Step 5: Rehearse the disassembly before the show closes

This is the step nobody does, and it is the one that turns the previous four steps from theatre into reality. Two days before strike, the build team takes one section of the installation — usually one full module — and disassembles it back to its components, in the exact order it will be done at strike, with the actual people who will be doing it at strike.

What this catches:

- **Tools missing from the strike kit.** ("We need a 13 mm socket and we have a 14.")
- **Components that have been over-tightened during the show.** (A bolt installed at 8 Nm and then bumped by visitors all week sometimes needs 25 Nm to release. The bigger torque wrench needs to be in the kit.)
- **Sub-assemblies that fight back.** (A panel that was beautifully reversible at design time has, in the act of being installed, been wedged behind a column and now needs the column out of the way first.)
- **Recycling routes that have changed.** (The local paper recycler has stopped accepting wax-coated card on a week's notice. Time to find a different stream.)

The rehearsal takes ninety minutes and saves four to six hours on strike day. More importantly, it forces the team to confront the actual reality of disassembly while there is still time to fix anything that is wrong.

## Putting it together: rebuilding LIVING PAPER, today

If I were to rebuild the 2014 LIVING PAPER stage with this workflow:

- **Step 1.** After-life: cardboard panels → paper recycler. Steel sub-frame → rental return to event-staging supplier. Hardware → reused for next project. Documentation: 38-row CSV in the project repository.
- **Step 2.** Module: 1200 × 800 mm cardboard panel as the base unit. Twenty-eight base panels combine into the eight large origami "shards" that make up the visual. Steel sub-frame is rented Octanorm 992 × 992 truss; the cardboard simply hangs off it.
- **Step 3.** No hot-melt anywhere. Cardboard panels join to each other with corrugated-friendly aluminium clip-fasteners (the kind used for moving boxes). Cardboard joins to the steel frame with hook-and-loop tape on aluminium L-profiles riveted to the truss. Strike time: about 4 hours for the whole installation, vs. the 12 hours it took us in 2014 with crowbars.
- **Step 4.** QR-labelled material passport on the back of every panel.
- **Step 5.** Disassembly rehearsal in the workshop the week before load-in, since the timeline at the venue is tight.

The visual would be effectively the same. The carbon footprint, by my best estimate, would be about 35% lower (a number I'd want to verify with a proper LCA). The amount that ends up in a landfill would be approximately zero.

## Where this workflow does not fit

Three honest exceptions:

- **Pyrotechnic, performative, or destructive works.** The piece is the destruction; planning for after-life would defeat the artwork. Argue for material substitution in the destruction itself, but accept that the workflow does not apply.
- **Deep-budget gallery commissions.** When a museum acquires the work after the show, "after-life" is the museum's collection, and the design conversation is about archival stability, not disassembly.
- **One-day pop-ups with no hand-off.** The fixed cost of material passports, rehearsals and modular dimensioning is too high for a single twelve-hour activation. For these, I aim for honest single-use: cardboard, no glue, paper recycling at end-of-day, and the rest of the workflow waived.

Everything else? The workflow pays for itself within the first project, in waste-disposal costs alone. The carbon and reputational benefits are an add-on.

## Further reading

- *Buildings as Material Banks* (BAMB) — the EU H2020 project that produced most of the modern thinking on material passports. The reports are open-access at [bamb2020.eu](https://www.bamb2020.eu/).
- The Ellen MacArthur Foundation's [Circular Design Guide](https://www.circulardesignguide.com/) has a strong section on reversible joinery.
- Read part one of this series, [The Honest Materials](./01-honest-materials.html), for the substrate comparison this workflow assumes.
- Continue to part three, [Five Reuse Patterns](./03-five-reuse-patterns.html), for the strategies that turn this workflow into a portfolio of reusable systems.

---

*This is part 2 of a three-part series. Previous: [The Honest Materials](./01-honest-materials.html). Next: [Five Reuse Patterns](./03-five-reuse-patterns.html).*
