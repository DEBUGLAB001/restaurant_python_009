# Goodfield Kitchen — Restaurant Service Desk

## 1. Your Mission: Investigate & Fix the Bugs

You are a **Full-Stack Developer** working on Goodfield Kitchen, an interactive restaurant operations dashboard designed to help kitchen staff manage live pickup, delivery, and dine-in orders during service. The QA team has identified six critical issues affecting everyday restaurant operations.

Your responsibility is to investigate the existing codebase, reproduce each issue, identify its root cause, and implement reliable fixes without disrupting existing functionality.

### BUG-01: Menu Search Fails to Find Matching Items

**Problem:** When searching for menu items by name, matching dishes fail to appear in the search results even though they exist on the restaurant menu.

**How to identify it:** Open the Start an Order modal in the Live Preview and type `"sandwich"` into the menu search bar. Notice that the menu displays *"No menu items match that search."*, even though the *"Smoky chicken sandwich"* is clearly available on the menu.

**Your task:** Ensure menu search returns all matching dishes containing the search query, regardless of uppercase or lowercase letters or how the menu is arranged.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/f2a8e97c-4cbd-4996-9afe-3c8c1c3407b6" />
</p>

### BUG-02: Popular Dishes Undercounts Total Units Sold

**Problem:** The "Guest favorites" section calculates popular dishes incorrectly, undercounting the total number of items guests have ordered.

**How to identify it:** Inspect the "Guest favorites" panel on the dashboard. Notice dishes are ranked by how many separate orders included them once, rather than the total number of units actually ordered. A dish ordered in large quantities (such as 5 orders of pasta on a single ticket) gets ranked lower than an item ordered only once or twice across separate tickets.

**Your task:** Ensure popular dishes are ranked accurately based on the total number of units sold across all customer orders, with consistent tie-breaking when totals are equal.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/ab999d71-6ba8-45af-b09e-791b0f567b3b" />
</p>

### BUG-03: Kitchen Queue Displays Tickets in Reverse Urgency

**Problem:** In the "Kitchen pulse" panel, low-urgency tickets appear at the top of the queue ahead of urgent tickets, and tickets with equal urgency lose their first-come, first-served order.

**How to identify it:** Inspect the "Kitchen pulse" panel under the "UP NEXT / QUEUE POSITION" section. Notice Ticket `#1047` with Urgency 1 (lowest priority) is sitting at Position 1 at the top of the queue, while urgent tickets `#1046` and `#1048` with Urgency 3 are pushed further down.

**Your task:** Ensure kitchen tickets are sorted with the highest urgency first, while keeping tickets of equal urgency in first-in, first-out (FIFO) order.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/883954e3-23e8-428b-b082-e1e5d51be3d5" />
</p>

### BUG-04: Prep Planning Selects Suboptimal Ticket Batches

**Problem:** The prep batch suggestion misses the most valuable combination of orders that can fit within the kitchen's available prep time, leaving kitchen capacity underutilized.

**How to identify it:** Look at the "Prep plan" card at the bottom of the right-hand panel on the dashboard. Notice it suggests `Best batch under 10 min: #1101` (value: 12, prep time: 6 minutes), leaving 4 minutes unused. It misses a much better combination of tickets (`#1102` and `#1103`) that together fit within 10 minutes and provide a total value of 20.

**Your task:** Ensure the prep batch planner selects the best possible combination of whole tickets that maximizes total value without exceeding the prep-time limit.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/6322e2d2-ee7d-40f7-9e2a-ec3748d76b31" />
</p>

### BUG-05: Order Total Omits Custom Add-Ons and Modifiers

**Problem:** When guests customize a dish with paid add-ons (such as adding avocado for $2 to a sandwich), the total bill only charges for the base item and ignores the extra cost of the add-ons.

**How to identify it:** Open the Start an Order modal, check the *"Add avocado to chicken sandwich +$2"* option, add 2 Smoky chicken sandwiches to your cart ($36.00 shown in the modal), and click *"Place order"*. Look at the newly added ticket in the "Live orders" list: the order total shows `$32.00` instead of `$36.00` because the extra $2 avocado charge per sandwich was left out.

**Your task:** Ensure the calculated order total includes the price of all selected modifiers and add-ons for every unit ordered.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/da3a2047-beed-4538-bf7f-593af34bfde7" />
</p>

### BUG-06: Order Status Can Skip Kitchen Workflow Steps

**Problem:** Orders can jump directly between invalid statuses (for example, jumping straight from `new` to `ready` without ever being `preparing`, or reopening completed orders), disrupting normal kitchen operations.

**How to identify it:** Look at the orders in the "Live orders" list. Attempting an invalid status jump (like moving an order directly from `new` to `ready`) is accepted by the application instead of being rejected.

**Your task:** Ensure orders strictly follow the sequential kitchen workflow (`new` → `preparing` → `ready` → `completed`), and reject any invalid or out-of-order status changes with an error.

<p align="center">
  <img width="1280" height="840" alt="image" src="https://github.com/user-attachments/assets/988bde3f-a45e-407b-af34-183e58fc79c1" />
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

1. **Menu Search:** Searching the menu returns all matching items regardless of letter casing or how menu items are arranged.

2. **Popular Dishes:** The popular dishes ranking accurately counts total units sold across order histories with consistent tie-breaking.

3. **Kitchen Queue:** Kitchen tickets in the queue are sorted with highest urgency first, maintaining first-come, first-served order for tickets of equal urgency.

4. **Prep Planning:** Prep planning selects the optimal combination of tickets that maximizes total value within the specified prep-time budget.

5. **Order Pricing:** Placing orders with item modifiers accurately incorporates modifier charges for all item quantities in the final total.

6. **Order Workflow:** Order status transitions strictly follow the valid sequence (`new` → `preparing` → `ready` → `completed`), rejecting any invalid or out-of-order changes.

All automated test suites must pass cleanly.

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
