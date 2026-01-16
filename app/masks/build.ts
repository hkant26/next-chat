import fs from "fs";
import path from "path";
import { CN_MASKS } from "./cn";
import { TW_MASKS } from "./tw";
import { EN_MASKS } from "./en";
import { type BuiltinMask } from "./typing";
import { getLang } from "../locales";

const getMasks = (lang: string) => {
  if (lang === "cn") {
    return CN_MASKS;
  }
  if (lang === "tw") {
    return TW_MASKS;
  }
  return EN_MASKS;
};

const BUILTIN_MASKS: Record<string, BuiltinMask[]> = {
  [getLang()]: getMasks(getLang()),
};

const dirname = path.dirname(__filename);

fs.writeFile(
  dirname + "/../../public/masks.json",
  JSON.stringify(BUILTIN_MASKS, null, 4),
  function (error) {
    if (error) {
      console.error("[Build] failed to build masks", error);
    }
  },
);
