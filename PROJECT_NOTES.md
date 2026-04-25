# Project Notes

## Current direction

This repo is meant to stay useful as a personal tool first.

That means:

- fewer moving parts
- local-first workflows when possible
- infrastructure only where it actually helps

## Product boundary

The main use case is still:

- upload a clip
- isolate a subject
- stylize it
- export something interesting

The real-estate angle is still interesting, but I do not want to design the whole codebase around that until the core rotoscope workflow feels good.

## Things worth keeping simple

- auth
- project records
- caption generation
- preview rendering

## Things worth making robust

- segmentation
- media storage
- export pipeline
- local dev setup
