# Test Cases - Wheel of Multiverse App

## 1. Item Management

### TC-001: Add Single Item
**Priority:** High
**Prerequisites:** App is loaded
**Steps:**
1. Enter "Test Item" in the item name field
2. Enter "5" in the weight field
3. Click "Add" button

**Expected Result:**
- Item "Test Item" with weight 5 appears in the item list
- Item appears on the wheel
- Input fields are cleared

### TC-002: Add Item with Default Weight
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Enter "Default Item" in the item name field
2. Leave weight field as "1"
3. Click "Add" button

**Expected Result:**
- Item "Default Item" with weight 1 appears in the item list

### TC-003: Add Item with Invalid Weight
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Enter "Invalid Item" in the item name field
2. Enter "-5" in the weight field
3. Click "Add" button

**Expected Result:**
- Item is added with weight adjusted to minimum valid value (0.1 or 1)

### TC-004: Add Item with Empty Name
**Priority:** High
**Prerequisites:** App is loaded
**Steps:**
1. Leave item name field empty
2. Enter "5" in the weight field
3. Click "Add" button

**Expected Result:**
- No item is added
- Item list remains unchanged

### TC-005: Multiline Add with Colon Separator
**Priority:** High
**Prerequisites:** App is loaded
**Steps:**
1. Click "Multi-line" toggle
2. Enter in the text area:
   ```
   Apple:3
   Banana:2
   Cherry:5
   ```
3. Click outside the text area or press Add

**Expected Result:**
- 3 items added: Apple (weight 3), Banana (weight 2), Cherry (weight 5)
- All items appear in the list and on the wheel

### TC-006: Multiline Add with Comma Separator
**Priority:** High
**Prerequisites:** App is loaded
**Steps:**
1. Click "Multi-line" toggle
2. Enter in the text area:
   ```
   Apple,3
   Banana,2
   Cherry,5
   ```
3. Click outside the text area

**Expected Result:**
- 3 items added with correct names and weights

### TC-007: Multiline Add with Tab Separator (Excel Paste)
**Priority:** High
**Prerequisites:** App is loaded, Excel with data
**Steps:**
1. In Excel, create two columns: Name and Weight
2. Copy the cells
3. Click "Multi-line" toggle in the app
4. Paste into the text area
5. Click outside the text area

**Expected Result:**
- Items are added with correct names and weights from Excel

### TC-008: Multiline Add with Mixed Formats
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Click "Multi-line" toggle
2. Enter in the text area:
   ```
   Apple	3
   Banana:2
   Cherry,5
   Durian
   ```
3. Click outside the text area

**Expected Result:**
- Apple added with weight 3 (tab separator has priority)
- Banana added with weight 2 (colon separator)
- Cherry added with weight 5 (comma separator)
- Durian added with default weight 1

### TC-009: Edit Item Name
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Click on an item name in the list
2. Change the name to "Updated Name"
3. Press Enter or click outside

**Expected Result:**
- Item name is updated in the list
- Wheel updates to show new name

### TC-010: Edit Item Weight
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Change the weight value of an item to "10"
2. Press Enter or click outside

**Expected Result:**
- Item weight is updated
- Wheel slice size adjusts proportionally

### TC-011: Delete Item
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Click the red "×" button on an item

**Expected Result:**
- Item is removed from the list
- Item is removed from the wheel
- Wheel redraws with remaining items

### TC-012: Disable/Enable Item
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Click the checkbox next to an item to uncheck it
2. Click the checkbox again to check it

**Expected Result:**
- When unchecked: Item becomes disabled (grayed out), removed from wheel
- When checked: Item becomes enabled, appears on wheel again

### TC-013: Search Items
**Priority:** Medium
**Prerequisites:** Multiple items exist
**Steps:**
1. Enter a search term in the "Search items..." field
2. Verify filtered results
3. Clear the search field

**Expected Result:**
- Only matching items are displayed during search
- All items reappear when search is cleared

### TC-014: Change Item Color
**Priority:** Medium
**Prerequisites:** At least one item exists
**Steps:**
1. Click the orange color button next to an item
2. Select a new color from the picker
3. Close the color picker

**Expected Result:**
- Item color updates in the wheel
- Color button shows the new color

---

## 2. Wheel Operations

### TC-015: Spin Wheel with Multiple Items
**Priority:** High
**Prerequisites:** At least 3 items exist and are enabled
**Steps:**
1. Click the "SPIN" button

**Expected Result:**
- Wheel starts spinning with animation
- Tick sound plays as wheel passes each item
- Wheel slows down and stops on a random item
- Result box displays the selected item with its color and weight
- Selected item is added to history

### TC-016: Spin Wheel with Single Item
**Priority:** Medium
**Prerequisites:** Exactly one item exists and is enabled
**Steps:**
1. Click the "SPIN" button

**Expected Result:**
- Wheel spins and stops on the only item
- Result is displayed

### TC-017: Attempt Spin with No Items
**Priority:** Medium
**Prerequisites:** No items exist or all items are disabled
**Steps:**
1. Click the "SPIN" button

**Expected Result:**
- Spin button is disabled
- No spin occurs

### TC-018: Spin Wheel During Active Spin
**Priority:** Medium
**Prerequisites:** Wheel is currently spinning
**Steps:**
1. While wheel is spinning, click "SPIN" button again

**Expected Result:**
- Button is disabled during spin
- No additional spin starts

### TC-019: Verify Weighted Probability
**Priority:** High
**Prerequisites:** Items with different weights exist (e.g., Item A: weight 10, Item B: weight 1)
**Steps:**
1. Spin the wheel 100 times
2. Record the results

**Expected Result:**
- Items with higher weights should be selected more frequently
- Distribution should roughly match the weight ratios

---

## 3. Preset Management

### TC-020: Load Race Preset
**Priority:** High
**Prerequisites:** App is loaded
**Steps:**
1. Click "Preset Settings" button
2. Go to "Default Presets" tab
3. Click "Race" button

**Expected Result:**
- 23 race items are loaded with correct names and weights
- Wheel name changes to "Race Wheel"
- Preset Settings modal closes
- Wheel displays all 23 races

### TC-021: Verify Race Preset Data
**Priority:** High
**Prerequisites:** Race preset is loaded
**Steps:**
1. Verify the following items and weights exist:
   - Symbiosis: 1.5
   - Goblin: 6.5
   - God: 2.5
   (and all other races)

**Expected Result:**
- All 23 races are present with correct weights

### TC-022: Load 1-10 Weight Preset
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Click "Preset Settings" button
2. Go to "Default Presets" tab
3. Click "1-10" button

**Expected Result:**
- 10 items (Option 1 to Option 10) are created
- Weights are 1 through 10 respectively
- Previous items are replaced

### TC-023: Load 1-5 Weight Preset
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Click "Preset Settings" button
2. Go to "Default Presets" tab
3. Click "1-5" button

**Expected Result:**
- 5 items (Option 1 to Option 5) are created
- Weights are 1 through 5 respectively

### TC-024: Save Custom Preset
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Click "Preset Settings" button
2. Go to "Saved Presets" tab
3. Click "Save Current" button
4. Enter preset name "My Custom Preset"
5. Click Save

**Expected Result:**
- Preset is saved with current items and wheel name
- Preset appears in the saved presets list

### TC-025: Load Saved Preset
**Priority:** High
**Prerequisites:** At least one preset is saved
**Steps:**
1. Click "Preset Settings" button
2. Go to "Saved Presets" tab
3. Click on a saved preset

**Expected Result:**
- Items are replaced with preset items
- Wheel name is restored
- Modal closes

### TC-026: Delete Saved Preset
**Priority:** Medium
**Prerequisites:** At least one preset is saved
**Steps:**
1. Click "Preset Settings" button
2. Go to "Saved Presets" tab
3. Click the trash icon next to a preset

**Expected Result:**
- Preset is removed from the list
- Preset is no longer available

### TC-027: Search Saved Presets
**Priority:** Low
**Prerequisites:** Multiple presets are saved
**Steps:**
1. Click "Preset Settings" button
2. Go to "Saved Presets" tab
3. Enter a search term in the search field

**Expected Result:**
- Only matching presets are displayed
- Search is case-insensitive

---

## 4. History Management

### TC-028: View History
**Priority:** High
**Prerequisites:** At least one spin has been performed
**Steps:**
1. Click "History" button

**Expected Result:**
- History modal opens
- All spin results are listed with:
  - Item name
  - Weight
  - Color indicator
  - Wheel name
  - Date and time

### TC-029: Clear History
**Priority:** High
**Prerequisites:** History contains entries
**Steps:**
1. Click "History" button
2. Click "Clear History" button
3. Confirm in the dialog

**Expected Result:**
- Confirmation dialog appears
- After confirmation, all history entries are deleted
- "No history yet" message is displayed
- History count shows (0)

### TC-030: Cancel Clear History
**Priority:** Medium
**Prerequisites:** History contains entries
**Steps:**
1. Click "History" button
2. Click "Clear History" button
3. Click "Cancel" in the dialog

**Expected Result:**
- Dialog closes
- History entries remain unchanged

### TC-031: Export History with Default Filename
**Priority:** High
**Prerequisites:** History contains entries
**Steps:**
1. Click "History" button
2. Click "Export CSV" button
3. Leave filename empty
4. Click "Export"

**Expected Result:**
- Export dialog appears
- CSV file downloads with filename format: wheel-history-YYYY-MM-DD.csv
- File contains all history entries with headers
- Success notification appears for 3 seconds

### TC-032: Export History with Custom Filename
**Priority:** High
**Prerequisites:** History contains entries
**Steps:**
1. Click "History" button
2. Click "Export CSV" button
3. Enter filename "my-results"
4. Click "Export"

**Expected Result:**
- CSV file downloads with filename: my-results.csv
- Success notification appears

### TC-033: Export History with Duplicate Filename
**Priority:** Medium
**Prerequisites:** History contains entries, file "test.csv" already exists in Downloads
**Steps:**
1. Click "History" button
2. Click "Export CSV" button
3. Enter filename "test"
4. Click "Export"

**Expected Result:**
- Browser automatically adds (1), (2), etc. to filename
- File downloads as test (1).csv

### TC-034: Verify CSV Format
**Priority:** High
**Prerequisites:** History exported
**Steps:**
1. Open the exported CSV file in Excel or text editor
2. Verify contents

**Expected Result:**
- Headers: #, Item Name, Weight, Color, Wheel Name, Date & Time
- Data rows match history entries
- Special characters are properly escaped
- File opens correctly in Excel

---

## 5. Utility Functions

### TC-035: Shuffle Items
**Priority:** Medium
**Prerequisites:** At least 3 items exist
**Steps:**
1. Note the current order of items
2. Click "Shuffle" button
3. Verify new order

**Expected Result:**
- Items are reordered randomly
- All items remain in the list
- No items are lost or duplicated

### TC-036: Balance Weights
**Priority:** Medium
**Prerequisites:** Items with different weights exist
**Steps:**
1. Create items with weights: 10, 5, 2
2. Click "Balance" button

**Expected Result:**
- All items now have weight = 1
- Wheel shows equal-sized slices

### TC-037: Reset All Items
**Priority:** Medium
**Prerequisites:** Some items are disabled
**Steps:**
1. Disable at least one item
2. Click "Reset All" button

**Expected Result:**
- All items become enabled
- All items reappear on the wheel

### TC-038: Clear All Items
**Priority:** High
**Prerequisites:** At least one item exists
**Steps:**
1. Click "Clear All" button

**Expected Result:**
- All items are removed
- Wheel shows empty state message
- Spin button is disabled

---

## 6. Audio Settings

### TC-039: Toggle Audio On/Off
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Click "Audio" dropdown
2. Toggle audio off
3. Spin the wheel
4. Toggle audio on
5. Spin the wheel again

**Expected Result:**
- When off: No tick sounds during spin
- When on: Tick sounds play during spin

### TC-040: Upload Custom Sound
**Priority:** Low
**Prerequisites:** App is loaded, have a valid audio file
**Steps:**
1. Click "Audio" dropdown
2. Click "Upload Custom SFX"
3. Select an audio file (.mp3, .wav, etc.)

**Expected Result:**
- File uploads successfully
- Custom sound plays during next spin

### TC-041: Reset to Default Sound
**Priority:** Low
**Prerequisites:** Custom sound is uploaded
**Steps:**
1. Click "Audio" dropdown
2. Click "Reset to Default"

**Expected Result:**
- Default tick sound is restored
- Default sound plays during next spin

---

## 7. Wheel Name

### TC-042: Set Wheel Name
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Click on the "Wheel name..." placeholder
2. Enter "My Lucky Wheel"
3. Press Enter or click outside

**Expected Result:**
- Wheel name updates to "My Lucky Wheel"
- Name is saved and persists

### TC-043: Clear Wheel Name
**Priority:** Low
**Prerequisites:** Wheel name is set
**Steps:**
1. Click on the wheel name
2. Delete all text
3. Press Enter

**Expected Result:**
- Placeholder "Wheel name..." reappears

---

## 8. Visual and UI

### TC-044: Verify Background Image
**Priority:** Low
**Prerequisites:** App is loaded
**Steps:**
1. Open the app
2. Observe the background

**Expected Result:**
- wheel-bg.png is displayed as background
- Background is fixed during scroll
- Background covers entire viewport

### TC-045: Verify Wheel Canvas Transparency
**Priority:** Medium
**Prerequisites:** App is loaded with items
**Steps:**
1. Observe the wheel area

**Expected Result:**
- Wheel canvas has transparent background
- Background image is visible around the wheel
- Only the wheel slices have colors

### TC-046: Verify Result Box Visibility
**Priority:** High
**Prerequisites:** Wheel has been spun
**Steps:**
1. Spin the wheel
2. Wait for result

**Expected Result:**
- Result box is visible next to the wheel
- Shows item name, color bar, and weight
- Has yellow border

### TC-047: Responsive Design - Mobile View
**Priority:** Medium
**Prerequisites:** Browser with responsive design tools
**Steps:**
1. Resize browser to mobile width (375px)
2. Test all major functions

**Expected Result:**
- Layout adjusts appropriately
- All buttons are accessible
- Wheel remains functional

### TC-048: Responsive Design - Tablet View
**Priority:** Low
**Prerequisites:** Browser with responsive design tools
**Steps:**
1. Resize browser to tablet width (768px)
2. Test all major functions

**Expected Result:**
- Layout adjusts appropriately
- Two-column layout may change to single column

---

## 9. Data Persistence

### TC-049: Reload Page with Items
**Priority:** High
**Prerequisites:** Items exist
**Steps:**
1. Add several items
2. Set wheel name
3. Reload the page (F5)

**Expected Result:**
- All items are restored
- Wheel name is restored
- Item states (enabled/disabled) are restored

### TC-050: Reload Page with History
**Priority:** High
**Prerequisites:** Spin history exists
**Steps:**
1. Perform several spins
2. Reload the page (F5)

**Expected Result:**
- All history entries are restored
- History count is correct

### TC-051: Reload Page with Saved Presets
**Priority:** Medium
**Prerequisites:** Custom presets are saved
**Steps:**
1. Save custom presets
2. Reload the page (F5)

**Expected Result:**
- All saved presets are restored

---

## 10. Edge Cases and Error Handling

### TC-052: Add 100+ Items
**Priority:** Low
**Prerequisites:** App is loaded
**Steps:**
1. Use multiline add to add 100+ items

**Expected Result:**
- All items are added
- Wheel displays correctly (text may be hidden for many items)
- Performance remains acceptable

### TC-053: Very Long Item Name
**Priority:** Low
**Prerequisites:** App is loaded
**Steps:**
1. Add item with name of 200+ characters

**Expected Result:**
- Item is added
- Name is truncated with ellipsis in display
- No layout breaking

### TC-054: Very Large Weight Value
**Priority:** Low
**Prerequisites:** App is loaded
**Steps:**
1. Add item with weight 999999

**Expected Result:**
- Item is added with the weight
- Wheel calculates proportions correctly

### TC-055: Zero Weight Items
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Add item with weight 0
2. Try to spin

**Expected Result:**
- Item with weight 0 is treated as disabled
- Does not appear on wheel
- Cannot be selected

### TC-056: Special Characters in Item Name
**Priority:** Medium
**Prerequisites:** App is loaded
**Steps:**
1. Add items with names: "Test & Co.", "Quote\"Test", "新年快乐", "🎉🎊"

**Expected Result:**
- All items are added correctly
- Special characters display properly
- CSV export handles special characters correctly

### TC-057: Browser LocalStorage Full
**Priority:** Low
**Prerequisites:** Browser with limited storage
**Steps:**
1. Fill localStorage to near capacity
2. Try to add items or save presets

**Expected Result:**
- Graceful error handling
- User is informed if save fails

### TC-058: Concurrent Modifications
**Priority:** Low
**Prerequisites:** App open in two tabs
**Steps:**
1. Open app in two browser tabs
2. Add items in one tab
3. Check the other tab

**Expected Result:**
- Changes may not sync (expected behavior for localStorage)
- No crashes or data corruption

---

## 11. Performance

### TC-059: Wheel Rendering Performance
**Priority:** Medium
**Prerequisites:** 50+ items exist
**Steps:**
1. Add 50 items
2. Spin the wheel
3. Observe animation smoothness

**Expected Result:**
- Wheel spins smoothly at 60 FPS
- No stuttering or lag
- Canvas caching works correctly

### TC-060: Large History Performance
**Priority:** Low
**Prerequisites:** Ability to generate many spins
**Steps:**
1. Perform 1000+ spins
2. Open history modal
3. Export to CSV

**Expected Result:**
- History loads within reasonable time
- Export completes successfully
- UI remains responsive

---

## Summary

**Total Test Cases:** 60

**By Priority:**
- High: 25
- Medium: 24
- Low: 11

**By Category:**
- Item Management: 14
- Wheel Operations: 5
- Preset Management: 8
- History Management: 7
- Utility Functions: 4
- Audio Settings: 3
- Wheel Name: 2
- Visual and UI: 5
- Data Persistence: 3
- Edge Cases: 7
- Performance: 2
