# Goodfield Kitchen — Restaurant Service Desk

## 1. Your Mission: Investigate & Fix the Bugs

You are a **Python / Full-Stack Developer** working on Goodfield Kitchen, an interactive restaurant operations dashboard designed to help kitchen staff manage live pickup, delivery, and dine-in orders during service. The QA team has identified six critical issues affecting menu lookup, dish analytics, ticket queue urgency, prep batch planning, order pricing, and workflow integrity.

Your responsibility is to investigate the existing codebase, reproduce each issue, identify its root cause, and implement reliable fixes without disrupting existing functionality.

### BUG-01: Menu Search Fails on Non-Alphabetical Menu Items

**Problem:** When searching for menu items like "sandwich" in the order creation modal, matching items fail to appear because binary search assumes the menu is sorted alphabetically, while the restaurant catalog is grouped by category.

**How to identify it:** Open the Start an Order modal in the Live Preview and type `"sandwich"` into the menu search input. Notice that the menu displays "No menu items match that search." even though "Smoky chicken sandwich" ($16.00) is on the menu.

**Your task:** Update `search_menu_items` in `catalog.py` to return every menu item whose name contains the search query substring, case-insensitively, regardless of how the menu is ordered.

<p align="center">
  <img src="assets/bug01_menu_search.png" alt="BUG-01: Menu Search Fails on Non-Alphabetical Menu Items" width="720" />
</p>

### BUG-02: Popular Dishes Ranking Undercounts Quantities and Repeated Orders

**Problem:** The "Guest favorites" panel displays inaccurate popularity rankings. The calculation collapses order line items into a set, ignoring item quantities and repeat orders, undercounting total units sold.

**How to identify it:** Inspect the "Guest favorites" panel on the dashboard. Notice dishes are ranked by distinct order presence rather than aggregate units sold. In test sales histories with high-quantity orders (e.g., 5 pastas in 1 order vs 1 fry across 2 orders), fries incorrectly outranks pasta.

**Your task:** Fix `best_sellers` in `analytics.py` to tally the actual units sold (`quantity`) across all order lines in sales history and ensure deterministic ordering for ties.

<p align="center">
  <img src="assets/bug02_popular_dishes.png" alt="BUG-02: Popular Dishes Ranking Undercounts Quantities and Repeated Orders" width="720" />
</p>

### BUG-03: Kitchen Queue Sorts Tickets in Reverse Urgency

**Problem:** In the "Kitchen pulse" panel, low-urgency tickets appear ahead of urgent tickets because tickets are sorted in ascending priority order instead of descending, and FIFO order is not maintained for equal-priority tickets.

**How to identify it:** Inspect the "Kitchen pulse" panel under "UP NEXT / QUEUE POSITION". Notice Ticket `#1047` with Urgency 1 (lowest priority) is placed at Position 1 at the top of the queue, while tickets `#1046` and `#1048` with Urgency 3 (highest priority) appear below it.

**Your task:** Correct `kitchen_queue` in `kitchen.py` to sort tickets by urgency (priority) in descending order while preserving first-in, first-out (FIFO) sequence for tickets with equal priority.

<p align="center">
  <img src="assets/bug03_kitchen_queue.png" alt="BUG-03: Kitchen Queue Sorts Tickets in Reverse Urgency" width="720" />
</p>

### BUG-04: Prep Planning Selects Suboptimal Ticket Batches

**Problem:** The prep batch recommendation relies on a greedy value-density heuristic that misses the optimal combination of whole orders fitting within the prep-time capacity, leaving valuable tickets unselected.

**How to identify it:** Look at the "Prep plan" card at the bottom of the right-hand column on the dashboard. Notice it selects `Best batch under 10 min: #1101` (value: 12, prep time: 6 min), leaving 4 minutes unused and missing tickets `#1102` (5 min, value 10) and `#1103` (5 min, value 10), which together yield a total value of 20.

**Your task:** Implement an optimal 0/1 knapsack selection algorithm in `choose_prep_batch` in `planner.py` that maximizes total ticket value within the given prep-time limit.

<p align="center">
  <img src="assets/bug04_prep_planning.png" alt="BUG-04: Prep Planning Selects Suboptimal Ticket Batches" width="720" />
</p>

### BUG-05: Order Total Omits Selected Item Modifiers

**Problem:** When guests customize an item by adding modifiers (such as adding avocado for $2 to the smoky chicken sandwich), the calculated order total only accounts for the base item price, omitting modifier costs.

**How to identify it:** Open the Start an Order modal, check the "Add avocado to chicken sandwich +$2" box, add 2 Smoky chicken sandwiches ($36.00 shown in modal cart), and click "Place order". Observe that the newly placed order in the "Live orders" table is billed as `$32.00` instead of `$36.00`.

**Your task:** Update `order_total` in `pricing.py` to include the price of each selected modifier for every unit in the line item when calculating the total bill.

<p align="center">
  <img src="assets/bug05_order_total_modifiers.png" alt="BUG-05: Order Total Omits Selected Item Modifiers" width="720" />
</p>

### BUG-06: Order Status Transitions Bypass Kitchen Workflow Steps

**Problem:** Orders can skip essential intermediate kitchen statuses (e.g., jumping directly from `new` to `ready` or reopening completed orders), disrupting kitchen operations and order integrity without validation.

**How to identify it:** Observe that tickets in "Live orders" can jump arbitrary statuses, such as advancing order `#1046` directly from `new` to `ready` skipping `preparing`. When an invalid status update is sent to PATCH `/api/orders/<id>`, the server accepts the change instead of raising a validation error.

**Your task:** Update `transition_order` in `orders.py` to enforce that orders advance strictly one step at a time (`new` → `preparing` → `ready` → `completed`), rejecting any invalid transition by raising a `ValueError` without altering the order.

<p align="center">
  <img src="assets/bug06_order_status_transitions.png" alt="BUG-06: Order Status Transitions Bypass Kitchen Workflow Steps" width="720" />
</p>

---

## 2. Get Familiar With the Application

Goodfield Kitchen is an interactive restaurant operations dashboard built for managing live pickup, delivery, and dine-in orders during service.

**Core Features:**

- **Live Order Management:** Track incoming dine-in, pickup, and delivery tickets across real-time kitchen status stages (`new` → `preparing` → `ready` → `completed`).

- **Interactive Ticket Creation:** Search the menu, select items with custom paid modifiers (such as avocado additions), calculate order subtotals, and submit live tickets.

- **Kitchen Queue Prioritization:** Organize kitchen tickets dynamically by urgency and preserve first-in, first-out (FIFO) sequence for tickets with equal urgency.

- **Popular Dishes Analytics:** Rank top-selling dishes by aggregate units sold across order histories to surface guest favorites.

- **Prep Batch Optimization:** Determine the optimal combination of kitchen tickets fitting a prep-time capacity to maximize order fulfillment value.

- **Responsive Service Dashboard:** Real-time floor status, active ticket metrics, average prep time tracking, and tabbed status filtering.

---

## 3. Expected Behaviour After Fixing the Bugs

Once all reported issues have been resolved, the application should behave as follows:

1. **Menu Search:** Searching the menu by substring (e.g., "sandwich") returns all matching items case-insensitively regardless of catalog configuration or category grouping.

2. **Popular Dishes:** The popular dishes ranking accurately counts total units sold across order histories with deterministic tie-breaking.

3. **Kitchen Queue:** Kitchen tickets in the queue are sorted with highest urgency (priority) first, maintaining FIFO order for equal-priority tickets.

4. **Prep Planning:** Prep planning selects the global optimal combination of tickets that maximizes total value within the specified prep-time budget (e.g., tickets `#1102` and `#1103` for a 10-minute limit).

5. **Order Pricing:** Placing orders with item modifiers accurately incorporates modifier charges for all item quantities in the final total.

6. **Order Workflow:** Order status transitions strictly follow the valid sequence (`new` → `preparing` → `ready` → `completed`), rejecting invalid or out-of-order changes with a `ValueError`.

All automated test suites in `tests/test_challenge.py` must pass with exit code `0`.

---

## 4. Integrated Terminal Commands

Your workspace provides an integrated terminal to execute the following commands:

**Start the Development Server**

```bash
bash start.sh
```
*Alternatively:*
```bash
python -m flask --app app run --reload --host 0.0.0.0 --port 5000
```
Starts the Goodfield Kitchen dashboard locally so you can interact with it through the Live Preview.

**Run Automated Tests**

```bash
pytest
```
*Alternatively:*
```bash
pytest -s -p no:terminal
```
Executes the automated test suite to verify your implementation and identify unresolved issues.

Use the Live Preview alongside the terminal to observe application behaviour and verify your changes.

---

## 5. Workspace Guidelines & Submission

You have access to the complete application codebase, an interactive Live Preview, an integrated terminal, and an AI-powered coding assistant.

**Available Workspace Tools:**

- **Code Editor:** Explore and modify the existing source code.

- **Live Preview:** Interact with the application and reproduce the six reported bugs.

- **Integrated Terminal:** Start the development server and execute automated tests.

- **AI Assistant:** Ask for explanations, debugging guidance, and help understanding unfamiliar code.

**Hard Reset Policy:**

The workspace includes a Hard Reset option that restores the challenge to its original state.

- Maximum of **2 Hard Reset activations**.

- A minimum cooldown of **10 minutes** between consecutive activations.

- Resetting discards your current code changes and restores the original challenge files.

Use Hard Reset carefully, as your progress will be lost.

**Before Submission:**

- Resolve all six reported bugs.

- Verify the fixes through the Live Preview.

- Run the automated tests (`pytest`).

- Ensure existing application functionality remains intact.

Once satisfied, submit your implementation through DEBUG//LAB.

Your solution will be evaluated using automated test cases, including hidden test cases that verify the correctness of your implementation.
