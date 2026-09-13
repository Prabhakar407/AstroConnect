// Local-only browser regression. Form/admin/Google identity responses are simulated.
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const output = process.env.ASTRO_BROWSER_OUTPUT || "/tmp/astro-browser-checks";
fs.mkdirSync(output, { recursive: true });
const times = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.ASTRO_BROWSER_EXECUTABLE,
    headless: true,
  });
  const results = [];
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 2560, height: 1440 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        viewport,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.clock.setFixedTime(new Date("2026-09-09T04:00:00Z"));
      let authenticated = false,
        cancelled = false,
        failDay = false,
        csrfWrites = 0;
      let closures = [
        {
          id: "initial-closure",
          start_time: "15:00",
          end_time: "16:00",
          reason: "Synthetic private time",
        },
      ];
      const errors = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("dialog", (dialog) => dialog.accept());
      await context.route("https://accounts.google.com/gsi/client", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: `window.google={accounts:{id:{initialize(options){this.options=options},renderButton(node){const button=document.createElement('button');button.textContent='Sign in with Google';button.onclick=()=>this.options.callback({credential:'synthetic-browser-google-credential'});node.appendChild(button)}}}};`,
        }),
      );
      await context.route("**/api/admin/**", async (route) => {
        const request = route.request(),
          url = new URL(request.url()),
          path = url.pathname;
        let status = 200,
          data = {};
        if (path.endsWith("/session")) {
          status = authenticated ? 200 : 401;
          data = authenticated
            ? {
                email: "astroadvicebyks@gmail.com",
                csrf_token: "synthetic-session-csrf",
              }
            : { detail: "Please sign in." };
        } else if (path.endsWith("/login/start"))
          data = {
            client_id: "synthetic-google-client-id",
            nonce: "synthetic-login-nonce",
          };
        else if (path.endsWith("/login")) {
          assert.equal(
            request.headers()["x-astro-csrf"],
            "synthetic-login-nonce",
          );
          assert.equal(
            request.postDataJSON().credential,
            "synthetic-browser-google-credential",
          );
          authenticated = true;
          data = {
            email: "astroadvicebyks@gmail.com",
            csrf_token: "synthetic-session-csrf",
          };
        } else if (path.endsWith("/google/status")) {
          data = { connected: true };
        } else if (path.endsWith("/booking-days")) {
          data = { month: url.searchParams.get("month"), days: cancelled ? {} : { "2026-09-10": 1 } };
        } else if (path.endsWith("/bookings")) {
          const filter = url.searchParams.get("view") || "upcoming";
          const visible = (!cancelled && filter === "upcoming") || (cancelled && filter === "cancelled");
          data = { items: visible ? [{
            id: "11111111-1111-4111-8111-111111111111", service_id: "name-change",
            service_name: "Name Change Consultation", question_count: 1, amount_paise: 510000,
            currency: "INR", duration_minutes: 30, starts_at: "2026-09-10T04:30:00Z",
            full_name: "Synthetic Customer", email: "synthetic@example.com", phone: "+919000000001",
            birth_date: "1990-01-02", birth_time: "10:30:00", birth_place: "New Delhi",
            notes: "Please compare two spellings.", state: cancelled ? "cancelled" : "confirmed",
            payment_state: "received", payment_reference: "pay_synthetic",
            payment_order_reference: "order_synthetic", calendar_state: cancelled ? "cancelled" : "ready",
            meet_url: cancelled ? null : "https://meet.google.com/abc-defg-hij",
          }] : [], next_cursor: null };
        } else if (path.endsWith("/day")) {
          if (failDay) {
            status = 503;
            data = { detail: "The calendar is temporarily unavailable." };
          } else
            data = {
              date: url.searchParams.get("date"),
              timezone: "Asia/Kolkata",
              closures,
              slots: times.map((time, index) => {
                const closed = closures.some(
                  (closure) =>
                    time >= closure.start_time && time < closure.end_time,
                );
                const state =
                  index === 0 && !cancelled
                    ? "booked"
                    : index === 1
                      ? "held"
                      : closed
                        ? "closed"
                        : "open";
                return {
                  time,
                  state,
                  can_cancel: state === "booked",
                  ...(index < 2 && state !== "open"
                    ? {
                        booking_id: `synthetic-booking-${index}`,
                        full_name: "Synthetic Customer",
                        service_name:
                          index === 0
                            ? "Name Change Consultation"
                            : "Prashna Kundali",
                        phone: "+919000000001",
                        email: "synthetic@example.com",
                        amount_paise: 510000,
                        question_count: 1,
                      }
                    : {}),
                };
              }),
            };
        } else {
          assert.equal(
            request.headers()["x-astro-csrf"],
            "synthetic-session-csrf",
          );
          csrfWrites++;
          if (path.endsWith("/logout")) {
            authenticated = false;
            data = { success: true };
          } else if (path.endsWith("/closures")) {
            const payload = request.postDataJSON();
            if (!payload.start_time) {
              status = 409;
              data = {
                detail:
                  "That range contains booked, reserved or already closed time. Choose a free range instead.",
              };
            } else {
              closures.push({ id: "new-closure", ...payload });
              data = { closure_id: "new-closure" };
            }
          } else if (path.endsWith("/reopen")) {
            closures = closures.filter((closure) => !path.includes(closure.id));
            data = { success: true };
          } else if (path.endsWith("/cancel")) {
            cancelled = true;
            data = {
              success: true,
              delivery_status: "pending",
              refund_instruction: "Refund to be done manually.",
            };
          } else throw new Error(`Unexpected private endpoint ${path}`);
        }
        await pause(100);
        await route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      });
      const shot = async (name) => {
        await page.evaluate(() =>
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "instant",
          }),
        );
        await pause(350);
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await pause(200);
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        await page.screenshot({
          path: `${output}/admin-${name}-${viewport.width}.png`,
          fullPage: true,
        });
      };
      await page.goto((process.env.ASTRO_BROWSER_BASE || "http://127.0.0.1:5185") + "/#/studio/calendar");
      await page.getByRole("button", { name: "Connect with Google" }).waitFor();
      await shot("locked");
      assert.equal(
        await page.getByRole("button", { name: "Close the whole day" }).count(),
        0,
      );
      await page.getByRole("button", { name: "Connect with Google" }).click();
      await page
        .getByRole("button", { name: "Sign in with Google", exact: true })
        .click();
      await page.getByRole("heading", { name: "Appointments", exact: true }).waitFor();
      await page.getByText("Synthetic Customer", { exact: true }).click();
      await page.getByText("Payment: pay_synthetic", { exact: true }).waitFor();
      await shot("appointments");
      await page.getByRole("button", { name: "Calendar", exact: true }).click();
      await page
        .getByRole("button", { name: "Thursday, 10 September, 1 appointment", exact: true })
        .click();
      await page.getByText("Payment in progress", { exact: true }).waitFor();
      await shot("day");
      await page.getByRole("button", { name: "Close the whole day" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "That range contains" })
        .waitFor();
      await shot("conflict");
      await page.getByLabel("From", { exact: true }).selectOption("11:00");
      await page.getByLabel("Until", { exact: true }).selectOption("12:00");
      await page
        .getByLabel("Note", { exact: false })
        .fill("Synthetic test closure");
      await page.getByRole("button", { name: "Close selected times" }).click();
      await page
        .getByText(
          "Availability closed. Existing appointments have not been changed.",
          { exact: true },
        )
        .waitFor();
      await page.getByText("Synthetic test closure", { exact: true }).waitFor();
      await shot("closed");
      await page
        .getByRole("button", { name: "Reopen", exact: true })
        .last()
        .click();
      await page
        .getByText(
          "These times are open again, subject to the normal booking hours and 10-day limit.",
          { exact: true },
        )
        .waitFor();
      await page
        .locator("summary")
        .filter({ hasText: "Name Change Consultation" })
        .click();
      await page
        .getByRole("button", { name: "Mark cancelled after phone call" })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Refund to be done manually" })
        .waitFor();
      await shot("cancelled");
      failDay = true;
      await page
        .getByRole("button", { name: "Refresh calendar", exact: true })
        .click();
      await page
        .getByText("The calendar is temporarily unavailable.", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Close the whole day" })
          .isDisabled(),
        true,
      );
      await shot("unavailable");
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await page.getByRole("button", { name: "Connect with Google" }).waitFor();
      assert.equal(await page.locator("summary").count(), 0);
      assert.deepEqual(errors, []);
      results.push({
        viewport,
        passed: true,
        csrfCheckedWrites: csrfWrites,
        applicationErrors: 0,
      });
      console.log("PASS", JSON.stringify(results.at(-1)));
      await context.close();
    }
    fs.writeFileSync(
      `${output}/admin-browser-results.json`,
      JSON.stringify(results, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
