import { createSlice } from "@reduxjs/toolkit";

const init = {};

export const slice = createSlice({
  name: 'msigner',
  initialState: init,
  reducers: {
    mock: (state) => state
  }
});

export const { mock } = slice.actions

export default slice.reducer