# Solutions Guide

A complete guide to resolving all 6 bugs in Goodfield Kitchen: where each bug is located in the codebase, the exact code changes needed, how to observe the bug on the frontend, and what changes on the screen after applying the fix.

---

### BUG-01: Menu Search Fails on Non-Alphabetical Menu Items

* **File:** `catalog.py`
* **Lines:** 9–19 (inside `search_menu_items`)

**Original Code:**
```python
    lo, hi = 0, len(items) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        name = items[mid]["name"].casefold()
        if target in name:
            return [items[mid]]
        if target < name:
            hi = mid - 1
        else:
            lo = mid + 1
    return []
```

**Correct Code:**
```python
    return [item for item in items if target in item["name"].casefold()]
```

* **How to see the bug on frontend:**
  1. Click **Start an order** on the top hero banner of the dashboard.
  2. Type `"sandwich"` into the **Search menu** field in the modal.
  3. Notice the modal displays **"No menu items match that search."** even though "Smoky chicken sandwich" ($16.00) is on the menu. Binary search assumed alphabetical order, but items are ordered by category (Small plates, Mains, Sides, etc.).
* **What changes after fixing:**
  * Searching `"sandwich"` immediately finds and displays **"Smoky chicken sandwich"** ($16.00, Mains, 14 min).
  * Substring queries return all matching items case-insensitively regardless of catalog ordering.

---

### BUG-02: Popular Dishes Undercounts Quantities and Repeated Orders

* **File:** `analytics.py`
* **Lines:** 9–11 (inside `best_sellers`)

**Original Code:**
```python
    for order in rows:
        for menu_id in {line["menu_id"] for line in order["items"]}:
            totals[menu_id] = totals.get(menu_id, 0) + 1
```

**Correct Code:**
```python
    for order in rows:
        for line in order["items"]:
            menu_id = line["menu_id"]
            totals[menu_id] = totals.get(menu_id, 0) + line.get("quantity", 1)
```

* **How to see the bug on frontend:**
  1. Inspect the **"Guest favorites"** card on the right column of the dashboard.
  2. The ranking only counts whether an item appeared in an order at least once (collapsing order lines into a `set`), completely ignoring how many units were ordered (`quantity`) and repeat order lines.
  3. If an item was ordered 5 times in a single order, it only counts as 1.
* **What changes after fixing:**
  * Popular dishes are ranked accurately by the total number of units sold across all order lines.
  * In tie-breaker situations, dishes with equal unit counts sort deterministically by their `menu_id`.

---

### BUG-03: Kitchen Queue Sorts Tickets in Reverse Urgency

* **File:** `kitchen.py`
* **Line:** 8 (inside `kitchen_queue`)

**Original Code:**
```python
    return sorted(rows, key=lambda ticket: (ticket["priority"], ticket["received_order"]))
```

**Correct Code:**
```python
    return sorted(rows, key=lambda ticket: (-ticket["priority"], ticket["received_order"]))
```

* **How to see the bug on frontend:**
  1. Inspect the **"Kitchen pulse"** panel in the right sidebar.
  2. Check the ticket sequence under **UP NEXT / QUEUE POSITION**:
     * Position 1 shows `#1047` with **Urgency 1** (least urgent).
     * Positions 2 and 3 show `#1046` and `#1048` with **Urgency 3** (highest urgency).
     * Lowest-urgency tickets are placed at the front of the queue, while urgent orders wait.
* **What changes after fixing:**
  * The queue is sorted with highest priority first: urgent tickets (Priority 3) appear at Positions 1 and 2.
  * Tickets with equal urgency preserve first-in, first-out (FIFO) sequence based on `received_order` (`#1046` received first appears ahead of `#1048`).

---

### BUG-04: Prep Planning Selects Suboptimal Ticket Batches

* **File:** `planner.py`
* **Lines:** 8–14 (inside `choose_prep_batch`)

**Original Code:**
```python
    chosen = []
    remaining = capacity
    for item in sorted(rows, key=lambda row: row["value"] / row["prep_minutes"], reverse=True):
        if item["prep_minutes"] <= remaining:
            chosen.append(item["id"])
            remaining -= item["prep_minutes"]
    return chosen
```

**Correct Code:**
```python
    n = len(rows)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        w = rows[i - 1]["prep_minutes"]
        v = rows[i - 1]["value"]
        for c in range(capacity + 1):
            if w <= c:
                dp[i][c] = max(dp[i - 1][c], dp[i - 1][c - w] + v)
            else:
                dp[i][c] = dp[i - 1][c]

    chosen = []
    c = capacity
    for i in range(n, 0, -1):
        if dp[i][c] != dp[i - 1][c]:
            chosen.append(rows[i - 1]["id"])
            c -= rows[i - 1]["prep_minutes"]
    chosen.reverse()
    return chosen
```

* **How to see the bug on frontend:**
  1. Look at the **"Prep plan"** box inside the "Guest favorites" panel.
  2. It shows: **`Best batch under 10 min: #1101`** (value: 12, prep time: 6 min).
  3. The greedy heuristic selected `#1101` and ran out of remaining time (only 4 min left), leaving valuable combination `#1102` (5 min, value 10) + `#1103` (5 min, value 10) unselected.
* **What changes after fixing:**
  * The prep plan text updates from **`#1101`** to **`#1102 + #1103`**.
  * Total batch value increases from 12 to 20, fully utilizing the 10-minute prep window.

---

### BUG-05: Order Total Omits Selected Item Modifiers

* **File:** `pricing.py`
* **Line:** 5 (inside `order_total`)

**Original Code:**
```python
def order_total(items):
    """Calculate the menu subtotal including paid modifiers."""
    return round(sum(line["quantity"] * line["unit_price"] for line in items), 2)
```

**Correct Code:**
```python
def order_total(items):
    """Calculate the menu subtotal including paid modifiers."""
    total = 0.0
    for line in items:
        mod_price = sum(mod.get("price", 0) for mod in line.get("modifiers", []))
        total += line["quantity"] * (line["unit_price"] + mod_price)
    return round(total, 2)
```

* **How to see the bug on frontend:**
  1. Click **Start an order**.
  2. Check the box **"Add avocado to chicken sandwich +$2"**.
  3. Click **"Smoky chicken sandwich"** twice (Quantity: 2). The modal cart footer displays `$36.00` ($16 base + $2 avocado × 2).
  4. Click **Place order**.
  5. In the **"Live orders"** list, look at the newly added ticket: the total shows **`$32.00`** instead of **`$36.00`** because the backend calculation ignored the modifier charges.
* **What changes after fixing:**
  * The newly submitted order correctly shows **`$36.00`** in the Live orders table, accurately charging for all units of selected modifiers.

---

### BUG-06: Order Status Transitions Bypass Kitchen Workflow Steps

* **File:** `orders.py`
* **Lines:** 6–9 (inside `transition_order`)

**Original Code:**
```python
def transition_order(order, next_status):
    """Advance an order exactly one step through the kitchen workflow."""
    order["status"] = next_status
    return order
```

**Correct Code:**
```python
def transition_order(order, next_status):
    """Advance an order exactly one step through the kitchen workflow."""
    current = order.get("status")
    allowed = ALLOWED_TRANSITIONS.get(current)
    if allowed != next_status:
        raise ValueError(f"Invalid transition from '{current}' to '{next_status}'")
    order["status"] = next_status
    return order
```

* **How to see the bug on frontend / API:**
  1. Kitchen tickets must strictly follow the workflow: `new` → `preparing` → `ready` → `completed`.
  2. Before the fix, an invalid transition request (such as jumping ticket `#1046` directly from `new` to `ready`, or modifying an already completed ticket) is accepted without error, returning HTTP 200 and disrupting the kitchen sequence.
* **What changes after fixing:**
  * Any invalid state transition attempt raises a `ValueError` on the server and responds with HTTP 409 Conflict.
  * Orders can only advance sequentially one valid step at a time through the kitchen workflow.

