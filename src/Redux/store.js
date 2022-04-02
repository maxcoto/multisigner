import { configureStore } from "@reduxjs/toolkit";
import msigner from './msigner';

export default configureStore({
  reducer: {
    msigner: msigner,
  },
});
