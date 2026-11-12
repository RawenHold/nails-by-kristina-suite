import { act, fireEvent, render, renderHook, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useImeSafeInput } from "./useImeSafeInput";
import { useImeSafeFields } from "./useImeSafeFields";
import { commitTextInput } from "@/lib/ime";

afterEach(cleanup);

describe("Android Russian text drafts", () => {
  it("reads Наращивание from DOM rather than a stale Наращ snapshot", () => {
    const { result } = renderHook(() => useImeSafeInput("Наращ"));
    const input = document.createElement("input");
    input.value = "Наращивание";
    result.current.ref.current = input;
    expect(result.current.read()).toBe("Наращивание");
  });

  it("keeps deliberate shortening and clearing instead of resurrecting old text", () => {
    const { result } = renderHook(() => useImeSafeInput("Гель лак"));
    const input = document.createElement("input");
    result.current.ref.current = input;
    input.value = "Гель";
    expect(result.current.read()).toBe("Гель");
    input.value = "";
    expect(result.current.read()).toBe("");
  });

  it("does not truncate composing notes when unrelated fields rerender", () => {
    let read: () => { notes: string } = () => ({ notes: "" });
    function Form({ amount }: { amount: number }) {
      const text = useImeSafeFields({ notes: "" });
      read = text.read;
      return <div><input aria-label="notes" {...text.field("notes")} /><span>{amount}</span></div>;
    }
    const view = render(<Form amount={0} />);
    const input = screen.getByLabelText("notes") as HTMLInputElement;
    fireEvent.compositionStart(input);
    fireEvent.input(input, { target: { value: "Материалы для наращивания" } });
    view.rerender(<Form amount={350000} />);
    expect(read().notes).toBe("Материалы для наращивания");
    expect(input.value).toBe("Материалы для наращивания");
  });

  it("reads the final keyboard update after blur before saving", async () => {
    const { result } = renderHook(() => useImeSafeInput("Наращ"));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "Наращ";
    result.current.ref.current = input;
    input.addEventListener("blur", () => setTimeout(() => { input.value = "Наращивание"; }, 0));
    input.focus();
    await act(() => commitTextInput());
    expect(result.current.read()).toBe("Наращивание");
    input.remove();
  });

  it("initializes a timer edit that mounts after reset with the saved note", () => {
    const { result, rerender } = renderHook(() => useImeSafeInput(""));
    act(() => result.current.reset("Гель лак"));
    rerender();
    expect(result.current.initial).toBe("Гель лак");
  });
});