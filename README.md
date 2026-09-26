# Diggerz Build 24.1 - Custom Wearables

This build includes the Diggerz custom wearable maker and runtime importer.

## Custom wearable import

Export a wearable package from `custom-wearable-maker.html`, then extract the package folder into `custom_hats/`.

Example:

```text
custom_hats/
  golden_cowboy_hat/
    golden_cowboy_hat.wearable.json
    1_hat.png
```

The JSON stores the item's name, type, Diggerz rig anchors, size, position, rotation, scale, and flip state. The game loads the JSON and PNGs together.

- Custom wearable IDs: 1000+
- Existing loose PNG custom hats remain supported at 700+
- Restart the server after adding a package.
- Admin item catalog discovers the imported wearable automatically.

## Maker controls

The maker uses the exact Diggerz rig and includes:

- click a layer to select it
- drag the selected image to move it
- drag corner handles to resize
- drag the circular rotate handle to rotate
- Flip H / Flip V
- numeric X/Y/rotation/scale controls
- animated Diggerz poses
- pants preset with waist + front leg + back leg slots
