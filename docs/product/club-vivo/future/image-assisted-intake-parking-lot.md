# Image-Assisted Intake Parking Lot

## Status

Parked / future exploration.

This note captures a future idea for Club Vivo / SIC Session Builder. It is not current implementation scope.

## Problem

Coaches often train in spaces that are difficult to describe cleanly in a form:

- gyms
- cement areas
- small or irregular fields
- fields with columns, walls, fences, or other obstacles
- tight spaces with limited equipment
- spaces that change from session to session

Those constraints can make a generated session less useful if the coach has to translate the space into text every time.

## Idea

Allow a coach to upload one or more images of the training space so Session Builder can draft a practical environment profile.

The image input would support the coach. It would not replace coach judgment or become the source of truth by itself.

## Future AWS / AI Possibilities

Possible future implementation building blocks:

- Amazon Rekognition or multimodal AI for coarse visual understanding
- a Bedrock multimodal model later if it is the better fit for structured environment reasoning
- S3 for tenant-scoped image storage
- strict access controls for all stored images
- retention rules so images are not kept longer than needed
- auditability around image use and deletion

## What It Could Help With

Image-assisted intake could help Session Builder draft:

- surface type
- approximate space constraints
- visible obstacles
- goal and equipment hints
- safety notes
- session setup recommendations
- constraints the coach should confirm before generation

## Guardrails

Any future version should follow these rules:

- do not identify people
- do not rely on image analysis as truth
- require the coach to confirm the environment before generation uses it
- do not accept client-supplied tenant scope
- use tenant-derived storage paths only
- avoid storing unnecessary images
- keep image access tenant-isolated
- provide clear retention and deletion behavior

## Not In Current Scope

This parking-lot item does not add:

- upload UI
- Rekognition integration
- S3 image pipeline
- production image analysis
- multi-image analysis
- image retention policy implementation
- image-derived generation without coach confirmation

## Future Questions

Questions to answer before building:

- What exact coach workflow needs image intake most: environment profile, setup-to-drill, or both?
- Is one image enough for v1, or does the product need multiple images?
- What should the coach be required to confirm before generation?
- Which model or service gives reliable enough coarse environment signals?
- What retention window is acceptable for clubs?
- Should images be deleted immediately after a confirmed profile is created?
- How should the UI explain that image analysis is advisory?
- What accessibility and privacy language should appear near upload?
- How should failed or uncertain image analysis degrade gracefully?
