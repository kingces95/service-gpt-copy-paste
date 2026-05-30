# Enforce Topological Part Attachment

Parts are attached in dependency order: a Part that supplies base behavior is
named before a Part that consumes or extends it. Attachment order is validated
against the reflected prototype graph, so the Part graph itself is the source of
dependency truth.
