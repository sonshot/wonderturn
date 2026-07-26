const MAX_SENTENCES = 3;
const MAX_WORDS = 60;
const sentenceSegmenter = new Intl.Segmenter("en", {
  granularity: "sentence",
});

function stripMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_`~]/g, "");
}

function isCompleteSentence(value: string) {
  return /[.!?]["'”’)\]]*$/.test(value);
}

function wordCount(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

export function normalizeAndBoundReply(candidate: string) {
  const normalized = stripMarkdown(candidate).replace(/\s+/g, " ").trim();
  const accepted: string[] = [];
  let acceptedWords = 0;

  for (const part of sentenceSegmenter.segment(normalized)) {
    const sentence = part.segment.trim();

    if (!isCompleteSentence(sentence)) {
      break;
    }

    const sentenceWords = wordCount(sentence);

    if (
      accepted.length === MAX_SENTENCES ||
      acceptedWords + sentenceWords > MAX_WORDS
    ) {
      break;
    }

    accepted.push(sentence);
    acceptedWords += sentenceWords;
  }

  if (accepted.length === 0) {
    throw new Error("Candidate contained no complete sentence");
  }

  return accepted.join(" ");
}
