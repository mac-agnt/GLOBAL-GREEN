/* One resourcing plan for the whole demo: Projects → Resources and
   Dashboard → Capacity both read it, so their figures always agree.
   Illustrative plan, aligned with each project's team, visits and deadlines. */
import type { StaffId } from "./data";
/* Planned billable days per person per project (illustrative resourcing plan,
   aligned with each project's team, visits and deadlines). */
export type Alloc = [string, number][];
export const PLAN: Record<number, Partial<Record<StaffId, Alloc>>> = {
  47: {
    niall: [["GG-256", .75], ["GG-248", .5], ["GG-251", .25]],
    aoife: [["GG-253", 1]],
    eoin: [["GG-241", 1.5], ["GG-246", 1], ["GG-254", 1], ["GG-238", .5], ["GG-244", .25]],
    sarah: [["GG-252", 2], ["GG-255", 1], ["GG-245", .75], ["GG-251", .75]],
    dara: [["GG-249", 1.8], ["GG-238", 1.3], ["GG-236", 1], ["GG-248", .7], ["GG-256", .3], ["GG-253", .2]],
    ciara: [["GG-247", 1], ["GG-243", 1.25], ["GG-241", 1], ["GG-257", .75]],
    mark: [["GG-243", 1], ["GG-241", 1], ["GG-244", .5], ["GG-238", .5], ["GG-236", .25], ["GG-250", .5], ["GG-254", .5]]
  },
  48: {
    niall: [["GG-256", .75], ["GG-248", .5], ["GG-241", .25]],
    aoife: [["GG-253", 1]],
    eoin: [["GG-241", 1.5], ["GG-254", 1], ["GG-246", 1], ["GG-238", .5]],
    sarah: [["GG-252", 1.75], ["GG-245", 1], ["GG-251", 1], ["GG-255", .75]],
    dara: [["GG-249", 1.8], ["GG-238", 1.2], ["GG-236", .8], ["GG-248", .8], ["GG-256", .3], ["GG-253", .2]],
    ciara: [["GG-247", .75], ["GG-243", 1], ["GG-257", 1], ["GG-249", .25]],
    mark: [["GG-241", 1.25], ["GG-243", .75], ["GG-238", .5], ["GG-250", .5], ["GG-254", .75], ["GG-244", .5], ["GG-236", .25]]
  },
  49: {
    niall: [["GG-256", .5], ["GG-248", .75], ["GG-252", .25]],
    aoife: [["GG-253", 1]],
    eoin: [["GG-241", 1], ["GG-246", 1.25], ["GG-254", 1], ["GG-244", .25]],
    sarah: [["GG-252", 1.75], ["GG-251", 1], ["GG-255", 1], ["GG-245", .5]],
    dara: [["GG-238", 1], ["GG-249", 1.5], ["GG-236", 1], ["GG-248", 1]],
    ciara: [["GG-243", 1.5], ["GG-257", 1], ["GG-249", .5]],
    mark: [["GG-243", 1], ["GG-250", .75], ["GG-254", .75], ["GG-244", 1], ["GG-246", .5], ["GG-236", .5]]
  },
  50: {
    niall: [["GG-256", .75], ["GG-248", .5]],
    aoife: [["GG-253", 1]],
    eoin: [["GG-246", 1], ["GG-254", 1], ["GG-244", .5]],
    sarah: [["GG-255", 1.5], ["GG-245", 1]],
    dara: [["GG-249", 1.75], ["GG-236", 1], ["GG-248", 1]],
    ciara: [["GG-243", 1], ["GG-249", .5]],
    mark: [["GG-244", 1], ["GG-254", .75], ["GG-236", .5], ["GG-250", .5]]
  }
};
