export type ValueData = {
  name: string;
  value: string | ValueData[];
};

type TokenObject = {
  [key: string]: string | TokenObject | { value: string };
};

/* =====================
 * 유틸 함수
 * ===================== */

/**
 * 재귀적으로 object → ValueData[] 변환
 */

const isValueObject = (value: unknown): value is { value: string } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'value' in value &&
    typeof (value as { value: string }).value === 'string'
  );
};
const getObjectToArray = (obj: TokenObject): ValueData[] => {
  return Object.entries(obj).map(([key, value]): ValueData => {
    if (typeof value === 'string') {
      return { name: key, value };
    }

    if (isValueObject(value)) {
      return { name: key, value: value.value };
    }

    // 여기까지 오면 무조건 TokenObject
    return {
      name: key,
      value: getObjectToArray(value),
    };
  });
};

/* =====================
 * 데이터 생성
 * ===================== */

const baseColor = (datas: TokenObject): Array<ValueData> => {
  const temp = getObjectToArray(datas);
  return temp;
};

export { baseColor, getObjectToArray };
