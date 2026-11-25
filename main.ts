// A tired dark lord's monologue, exactly one hundred words.
//
// The villain has done this four hundred times: the torches, the
// prophecy, the hero on the stairs. He never says he is tired —
// the tiredness is in the short sentences, in the way he waves the
// ritual away, and in knees that filed a complaint years ago. He is
// still a villain, though: the whole staged fight is his scheme,
// and the last line is the bargain. He has already lost. He only
// asks the hero to make the loss look expensive.
//
// The program does one small job: it writes the monologue to
// entry.txt in the output directory, then reads the file back and
// proves, byte for byte, that what landed is what was written.
// Nothing is read from the clock, the network, or anywhere else,
// so every run produces the same file.
//
// Only the Node standard library is used.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// The monologue itself: one line, one hundred words, and no
// trailing newline in the file it is written to.
const MONOLOGUE =
  'Oh. Another hero. Sit. The torches are lit, and I have given this speech four hundred times. Yes, the prophecy. Yes, the sword. Yes, the oath. I wrote most of it. Here is the plan. You climb the tower, you shout something brave, I pretend to be surprised, and by midnight we are both home. Except the tower has stairs. Three hundred. My knees filed a complaint years ago. So skip the stairs, take the balcony, and we shall shout down here, where I can sit. Tell the bards you climbed. I have already lost, hero. Make it look expensive.';

// How many words the bounty asks for.
const WORDS_WANTED = 100;

const ENTRY_FILENAME = 'entry.txt';

/**
 * Count the words the way a reader would: tokens split apart by
 * whitespace. The monologue holds no hyphens, no dashes standing
 * alone, and no apostrophes, so every way of counting words that
 * splits on whitespace lands on the same number.
 *
 * This is only one half of the check. A second, independent count
 * (see wordCountByLetters) has to agree with it before the entry
 * is written, so a miscount by one method cannot slip through.
 */
function wordCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

/**
 * Count the words a second, independent way: runs of letters
 * matched by /[A-Za-z]+/g. It ignores punctuation and digits
 * entirely, so it agrees with wordCount only when every token is
 * exactly one word of letters — which is how the monologue is
 * written. If the two methods disagree, something in the text is
 * not what a reader would count, and the entry must not be written.
 */
function wordCountByLetters(text: string): number {
  const matches = text.match(/[A-Za-z]+/g);
  return matches === null ? 0 : matches.length;
}

/**
 * The monologue must be exactly one hundred words on a single
 * line. Anything else is not the entry the bounty asked for, so
 * refuse to write it instead of handing in the wrong text.
 *
 * The word count is cross-checked two independent ways: splitting
 * on whitespace (wordCount) and counting runs of letters
 * (wordCountByLetters). Both must land on exactly one hundred;
 * if they disagree with each other, the text is refused even
 * when one of them happens to say one hundred.
 */
function monologueIsGood(): boolean {
  const words = wordCount(MONOLOGUE);
  const letters = wordCountByLetters(MONOLOGUE);
  if (words !== letters) {
    process.stderr.write(
      `[monologue] word counts disagree: whitespace ${words}, letters ${letters}\n`,
    );
    return false;
  }
  if (words !== WORDS_WANTED) {
    process.stderr.write(`[monologue] ${words} words, wanted ${WORDS_WANTED}\n`);
    return false;
  }
  if (MONOLOGUE.includes('\n') || MONOLOGUE.includes('\r')) {
    process.stderr.write('[monologue] the monologue must be a single line\n');
    return false;
  }
  return true;
}

/**
 * The grader names the output directory; fall back to /output.
 * The directory is created when it is missing and never removed,
 * and nothing already inside it is touched.
 */
function outputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv !== undefined && fromEnv !== '' ? fromEnv : '/output';
}

/** Write the monologue as UTF-8, with no trailing newline. */
function writeMonologue(dir: string): string {
  mkdirSync(dir, { recursive: true });
  const target = join(dir, ENTRY_FILENAME);
  writeFileSync(target, MONOLOGUE, 'utf-8');
  return target;
}

/**
 * Read the file back and check it against the monologue, then print
 * its word count and sha256, so one run can be compared with any
 * other run and a silent change to the file is caught at once.
 */
function checkWritten(target: string): boolean {
  if (!existsSync(target)) {
    process.stderr.write(`[monologue] ${target} was not created\n`);
    return false;
  }
  const back = readFileSync(target, 'utf-8');
  if (back !== MONOLOGUE) {
    process.stderr.write('[monologue] entry.txt differs from the monologue\n');
    return false;
  }
  const sha = createHash('sha256').update(back, 'utf-8').digest('hex');
  process.stdout.write(
    `[monologue] wrote ${target} (${wordCount(MONOLOGUE)} words, sha256 ${sha})\n`,
  );
  return true;
}

/** The whole run: check the monologue, write it, prove it landed. */
function main(): void {
  if (!monologueIsGood()) {
    process.exit(1);
  }
  const target = writeMonologue(outputDir());
  if (!checkWritten(target)) {
    process.exit(1);
  }
}

main();
