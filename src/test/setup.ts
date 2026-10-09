import "@testing-library/jest-dom/vitest";
import "../i18n";
import { beforeEach } from "vitest";
import { clearSessionToken } from "../features/auth/session";

beforeEach(() => clearSessionToken());
