let getIncrementZ = (function static_func(value) {
  let i = value;
  return function () {
    return ++i;
  };
})(2000);

const getRandomId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export { getIncrementZ, getRandomId };
