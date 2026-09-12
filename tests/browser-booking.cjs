// Local-only browser regression. Form/admin/Google identity responses are simulated.
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const assert = require("node:assert/strict");
const fs = require("node:fs");
const output = process.env.ASTRO_BROWSER_OUTPUT || "/tmp/astro-browser-checks";
fs.mkdirSync(output, { recursive: true });
const base = process.env.ASTRO_BROWSER_BASE || "http://127.0.0.1:5186/";
const catalogue = require('../src/data/consultationCatalogue.json');
const slotTimes = [
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
      // Keep a predictable booking day, but let animation timestamps advance.
      await page.clock.install({ time: new Date("2026-09-09T04:00:00Z") });
      const errors = [],
        sent = [];
      let sendFailure = false,
        saveMode = "failure",
        availabilityFailure = false,
        verificationDelay = 0;
      page.on("pageerror", (error) => errors.push(error.message));
      await context.route("**/api/**", async (route) => {
        const request = route.request(),
          path = new URL(request.url()).pathname;
        if (new URL(request.url()).hostname !== "127.0.0.1") {
          // The embedded map also uses /api/ URLs. It is not a form endpoint.
          await route.abort();
          return;
        }
        let status = 200,
          data = {};
        const policy = { booking_enabled: true, server_now: '2026-09-09T04:00:00Z', first_date: '2026-09-09', last_date: '2026-09-19', timezone: 'Asia/Kolkata', duration_minutes: 30, minimum_notice_minutes: 30, slot_times: slotTimes };
        if (path === "/api/booking-policy") data = policy;
        else if (path === '/api/quote') {
          const params = new URL(request.url()).searchParams;
          const service = catalogue.find(item => item.id === params.get('service_id'));
          const count = Number(params.get('question_count') || 1);
          data = { service_id: service.id, service_name: service.title, question_count: count, amount_paise: service.amount_paise * count, currency: 'INR', duration_minutes: 30, quote_version: 'a'.repeat(64) };
        }
        else if (path === "/api/availability") {
          if (availabilityFailure) {
            status = 503;
            data = {
              detail:
                "Availability could not be checked. Please call the studio.",
            };
          } else
            data = { ...policy, date: new URL(request.url()).searchParams.get('date'), slots: Object.fromEntries(
              slotTimes.map((time) => [time, time !== "10:00"]),
            ) };
        } else if (path === '/api/inquiry-status') {
          status = 403;
          data = { detail: 'The synthetic inquiry has not been saved.' };
        } else if (path === "/api/auth/send-otp") {
          if (sendFailure) {
            status = 503;
            data = { detail: "We could not send the verification email." };
          } else data = { success: true };
        } else if (path === "/api/auth/verify-otp") {
          await pause(verificationDelay);
          data = {
            success: true,
            verification_token:
              "synthetic-browser-token-not-real-1234567890123",
          };
        } else if (request.method() === "POST") {
          sent.push({ path, payload: request.postDataJSON() });
          await pause(400);
          if (path === "/api/book-appointment" || saveMode === "failure") {
            status = 503;
            data = {
              detail:
                "The request could not be saved. Please retry or call the studio.",
            };
          } else
            data = {
              status: "success",
              inquiry_id: "11111111-1111-4111-8111-111111111111",
              email_status: "pending",
            };
        }
        await route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(data),
        });
      });
      const shot = async (name) => {
        await page.evaluate(() => document.fonts.ready);
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        // A jump to the footer skips intermediate scroll-triggered sections.
        for (let y = 0; y < height; y += Math.floor(viewport.height * 0.7)) {
          await page.evaluate(top => window.scrollTo({ top, behavior: "instant" }), y);
          await pause(150);
        }
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await pause(750);
        const width = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        assert.ok(
          width.document <= width.viewport + 1,
          `${name}: page overflow ${JSON.stringify(width)}`,
        );
        await page.screenshot({
          path: `${output}/${name}-${viewport.width}.png`,
          fullPage: true,
        });
      };
      const verify = async () => {
        await page.getByRole("dialog").waitFor();
        await pause(250);
        const inputs = page.getByRole("dialog").locator("input");
        assert.equal(await inputs.count(), 6);
        for (let index = 0; index < 6; index++)
          await inputs.nth(index).fill("1");
        try {
          await page
            .getByRole("dialog")
            .waitFor({ state: "hidden", timeout: 5000 });
        } catch (error) {
          console.log(
            "DIALOG_DIAGNOSTIC",
            await page.getByRole("dialog").innerText(),
            errors,
          );
          await shot("dialog-diagnostic");
          throw error;
        }
      };
      await page.goto(base + "#/booking");
      await page.locator("#readingType").selectOption("prashna-kundali");
      await page.locator("#questionCount").selectOption("10");
      assert.ok(
        (await page.locator("#booking-form").innerText()).includes("₹11,000"),
      );
      assert.ok(
        (await page.locator("#booking-form").innerText()).includes(
          "30-minute session",
        ),
      );
      assert.equal(
        await page
          .getByRole("button", { name: "13", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "20", exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "19", exact: true })
          .isDisabled(),
        false,
      );
      await page.getByRole("button", { name: "10", exact: true }).click();
      await page.getByRole("button", { name: /10:30 AM.*11:00 AM/ }).waitFor();
      await shot("booking-questions");
      const overflows = await page
        .locator("#booking-form button")
        .evaluateAll((nodes) =>
          nodes
            .filter((node) => node.scrollWidth > node.clientWidth + 2)
            .map((node) => node.innerText),
        );
      assert.deepEqual(overflows, [], "Booking controls must not overflow");
      await page.locator("#name").fill("Synthetic Test");
      await page.locator("#email").fill("synthetic@example.com");
      await page.locator("#phone").fill("+919000000001");
      await page.locator("#birthDate").fill("2000-01-01");
      await page.getByRole("button", { name: /10:30 AM.*11:00 AM/ }).click();
      await page.locator("#booking-form button[type=submit]").click();
      await verify();
      assert.equal(
        await page
          .getByText("Booking Request Received!", { exact: true })
          .count(),
        0,
      );
      await page
        .getByText(
          "The request could not be saved. Please retry or call the studio.",
          { exact: false },
        )
        .waitFor();
      assert.equal(await page.locator("#name").inputValue(), "Synthetic Test");
      assert.equal(sent.at(-1).payload.question_count, 10);
      assert.equal(sent.at(-1).payload.duration_minutes, 30);
      assert.equal(sent.at(-1).payload.birth_date, '2000-01-01');
      assert.equal(sent.at(-1).payload.birth_time, '');
      assert.equal('birth_details' in sent.at(-1).payload, false);
      assert.equal("amount_paise" in sent.at(-1).payload, false);
      await shot("booking-save-error");
      availabilityFailure = true;
      await page.getByRole("button", { name: "11", exact: true }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Availability could not" })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: /10:30 AM.*11:00 AM/ })
          .isDisabled(),
        true,
      );
      await shot("booking-availability-error");
      assert.equal(await page.locator('#booking-form button[type=submit]').isDisabled(), true);
      availabilityFailure = false;
      await page.locator("#readingType").selectOption("numerology");
      assert.equal(await page.locator("#questionCount").count(), 0);
      assert.ok(
        (await page.locator("#booking-form").innerText()).includes("₹3,100"),
      );
      await page.locator("#readingType").selectOption("name-change");
      assert.ok(
        (await page.locator("#booking-form").innerText()).includes("₹5,100"),
      );

      await page.goto(base + "#/contact");
      await page.locator("#name").fill("Synthetic Test");
      await page.locator("#email").fill("synthetic@example.com");
      await page.locator("#phone").fill("+919000000001");
      await page
        .locator("#message")
        .fill("This is an isolated browser test, not a real inquiry.");
      sendFailure = true;
      await page.locator("form button[type=submit]").click();
      await page
        .getByText("We could not send the verification email.", {
          exact: false,
        })
        .waitFor();
      assert.equal(await page.getByRole("dialog").count(), 0);
      await shot("contact-code-error");
      sendFailure = false;
      // Keyboard focus stays in the verification dialog; Escape restores the form.
      await page.locator("form button[type=submit]").click();
      await page.getByRole("dialog").waitFor();
      await pause(250);
      await page.getByRole("button", { name: "Close email verification" }).focus();
      await page.keyboard.press("Shift+Tab");
      assert.equal(await page.locator(':focus').getAttribute('aria-label'), 'Verification digit 6');
      await page.getByRole("dialog").screenshot({path:`${output}/email-verification-${viewport.width}.png`});
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({state:"hidden"});
      // A delayed response from a dialog the customer closed must not submit anything.
      const beforeClosedVerification = sent.length;
      verificationDelay = 900;
      await page.locator("form button[type=submit]").click();
      await page.getByRole("dialog").waitFor();
      await pause(250);
      for(let index=0;index<6;index++) await page.getByRole("dialog").locator('input').nth(index).fill('1');
      await page.getByRole("button", { name: "Close email verification" }).click();
      await page.getByRole("dialog").waitFor({state:"hidden"});
      await pause(1100);
      assert.equal(sent.length, beforeClosedVerification);
      assert.equal(await page.locator("#name").inputValue(), "Synthetic Test");
      verificationDelay = 0;
      await page.locator("form button[type=submit]").click();
      await verify();
      assert.equal(
        await page.getByText("Message Submitted!", { exact: true }).count(),
        0,
      );
      await page
        .getByText("The request could not be saved.", { exact: false })
        .waitFor();
      const retryId = sent.at(-1).payload.request_id;
      assert.equal(await page.locator("#name").inputValue(), "Synthetic Test");
      await shot("contact-save-error");
      saveMode = "success";
      await page.locator("form button[type=submit]").click();
      await verify();
      await page.getByText("Message Submitted!", { exact: true }).waitFor();
      assert.equal(sent.at(-1).payload.request_id, retryId);
      assert.ok(
        (
          await page
            .getByRole("link", { name: "Continue on WhatsApp" })
            .getAttribute("href")
        ).startsWith("https://wa.me/918527790801"),
      );
      assert.equal(
        (await page.locator("body").innerText()).includes(
          "local_contacts.json",
        ),
        false,
      );
      await shot("contact-saved");

      await page.goto(base + "#/");
      await page.locator("#form-name").fill("Synthetic Test");
      await page.locator("#form-email").fill("synthetic@example.com");
      await page.locator("#form-dob").fill("2000-01-01");
      if (viewport.width >= 1024)
        await page
          .locator("#quick-connect")
          .getByRole("button", { name: "Vedic Astrology", exact: true })
          .click();
      else {
        await page
          .getByRole("button", {
            name: "Select Service of Interest (Required)*",
          })
          .click();
        await page
          .locator("#home-inquiry-service-options")
          .getByRole("button", { name: "Vedic Astrology", exact: true })
          .click();
      }
      saveMode = "failure";
      await page.locator("#quick-connect form button[type=submit]").click();
      await verify();
      await page
        .getByText("The request could not be saved.", { exact: false })
        .waitFor();
      assert.equal(
        await page.locator("#form-name").inputValue(),
        "Synthetic Test",
      );
      assert.equal(
        await page.getByText("Inquiry received", { exact: true }).count(),
        0,
      );
      await page
        .locator("#quick-connect")
        .screenshot({
          path: `${output}/home-inquiry-error-${viewport.width}.png`,
        });

      await page.goto(base + "#/services/prashna-kundali");
      const form = page.locator("#prashna-form");
      for (const [name, value] of Object.entries({
        name: "Synthetic Test",
        email: "synthetic@example.com",
        phone: "+919000000001",
        location: "New Delhi",
        question: "This is an isolated test question, not a real inquiry.",
      }))
        await form.locator(`[name=${name}]`).fill(value);
      await form.locator("button[type=submit]").click();
      await verify();
      await page
        .getByText("The request could not be saved.", { exact: false })
        .waitFor();
      assert.equal(
        await form.locator("[name=name]").inputValue(),
        "Synthetic Test",
      );
      await form.screenshot({
        path: `${output}/prashna-inquiry-error-${viewport.width}.png`,
      });
      assert.deepEqual(errors, []);
      results.push({
        viewport,
        passed: true,
        interceptedSubmissions: sent.length,
        applicationErrors: errors.length,
        controlOverflows: overflows,
      });
      console.log("PASS", JSON.stringify(results.at(-1)));
      await context.close();
    }
    fs.writeFileSync(
      `${output}/browser-results.json`,
      JSON.stringify(results, null, 2),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
