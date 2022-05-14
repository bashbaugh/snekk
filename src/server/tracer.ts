import tracer from "dd-trace";
if (process.env.NODE_ENV === 'production') tracer.init({
  logInjection: true,
  env: 'prod-1'
}); // initialized in a different file to avoid hoisting.
export default tracer;
