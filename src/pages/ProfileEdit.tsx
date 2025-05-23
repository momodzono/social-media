import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Input,
  Button,
  Typography,
  Alert,
  Space,
  DatePicker,
  Upload,
  message,
  Spin,
  Avatar,
} from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { RcFile, UploadFile, UploadProps } from "antd/es/upload/interface";
import { api } from "../store/api";
import { useNavigate } from "react-router";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Date restriction function
const getAgeRestrictedDates = (current: dayjs.Dayjs) => {
  const minDate = dayjs().subtract(110, "year");
  const maxDate = dayjs().subtract(16, "year");
  return current && (current > maxDate || current < minDate);
};

// Validation schema
const profileSchema = z.object({
  name: z.string().min(1, "Введите имя").optional(),
  birthday: z
    .date()
    .refine((val) => dayjs(val).isValid(), { message: "Неверная дата" })
    .refine((val) => dayjs(val).isBefore(dayjs().subtract(16, "year")), {
      message: "Возраст не может быть меньше 16 лет",
    })
    .refine((val) => dayjs(val).isAfter(dayjs().subtract(110, "year")), {
      message: "Возраст не может быть больше 110 лет",
    })
    .optional(),
  description: z.string().optional(),
  photo: z.instanceof(File).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function getObjectDifference(oldObj, newObj) {
  const diff = {};

  // Проверяем все ключи нового объекта
  for (const key in newObj) {
    // Если значение отличается (и оно не undefined в новом объекте)
    if (newObj[key] !== undefined && oldObj[key] !== newObj[key]) {
      // Если оба значения - объекы (и не null), рекурсивно ищем разницу
      if (
        typeof oldObj[key] === "object" &&
        oldObj[key] !== null &&
        typeof newObj[key] === "object" &&
        newObj[key] !== null
      ) {
        const nestedDiff = getObjectDifference(oldObj[key], newObj[key]);
        if (Object.keys(nestedDiff).length > 0) {
          diff[key] = nestedDiff;
        }
      } else {
        diff[key] = newObj[key];
      }
    }
  }

  return diff;
}

const prepareFormData = (data: any) => {
  if (!data) return {};
  return {
    ...data,
    birthday: new Date(data?.birthday),
  };
};

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [updateProfile, { isLoading }] = api.useUpdateProfileMutation();
  const { data } = api.useGetProfileQuery({});

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: (formData) => {
      const diff = getObjectDifference(data?.profile, formData);

      try {
        const result = profileSchema.safeParse(diff);

        return {
          values: result.success ? result.data : {},
          errors: result.success ? {} : result.error.formErrors.fieldErrors,
        };
      } catch (error) {
        return {
          values: {},
          errors: { root: { message: "Ошибка обработки данных" } },
        };
      }
    },
    defaultValues: {
      name: "",
      description: "",
    },
    values: prepareFormData(data?.profile),
  });
  console.log(profileSchema.safeParse(watch())?.error);
  const uploadProps: UploadProps = {
    onRemove: () => {
      setFileList([]);
      setValue("photo", undefined);
      return true;
    },
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Можно загружать только изображения!");
        return false;
      }

      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error("Изображение должно быть меньше 2MB!");
        return false;
      }

      setFileList([file]);
      setValue("photo", file);
      return false;
    },
    fileList,
    maxCount: 1,
  };

  const onSubmit = async (result: ProfileFormData) => {
    setProfileError(null);
    try {
      await updateProfile(result).unwrap();

      message.success("Профиль успешно сохранен");
      navigate("/profile");
    } catch (error) {
      console.error("Ошибка при сохранении профиля:", error);
      setProfileError(
        typeof error === "string" ? error : "Ошибка при заполнении профиля",
      );
    }
  };

  const getPhotoLink = () => {
    const photo = watch("photo");

    if (typeof photo === "string") return photo;

    if (photo instanceof File) {
      return URL.createObjectURL(photo);
    }

    return;
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "2rem 1rem" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", margin: 0 }}>
          Внесите изменение
        </Title>

        {profileError && (
          <Alert
            message={profileError}
            type="error"
            showIcon
            closable
            onClose={() => setProfileError(null)}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="Введите имя"
                    size="large"
                    status={errors.name ? "error" : undefined}
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                      {errors.name.message}
                    </div>
                  )}
                </div>
              )}
            />

            <Controller
              name="birthday"
              control={control}
              render={({ field }) => (
                <div>
                  <DatePicker
                    value={field.value ? dayjs(field.value) : null}
                    onChange={(date) =>
                      field.onChange(date ? date.toDate() : null)
                    }
                    placeholder="Выберите дату рождения"
                    size="large"
                    style={{ width: "100%" }}
                    status={errors.birthday ? "error" : undefined}
                    disabledDate={getAgeRestrictedDates}
                    format="DD.MM.YYYY"
                    suffixIcon={<CalendarOutlined />}
                    disabled={isLoading}
                  />
                  {errors.birthday && (
                    <div style={{ color: "#ff4d4f", marginTop: 4 }}>
                      {errors.birthday.message}
                    </div>
                  )}
                </div>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div>
                  <TextArea
                    {...field}
                    placeholder="Расскажите о себе (необязательно)"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>
              )}
            />
            {getPhotoLink() && <Avatar size={64} src={getPhotoLink()} />}
            <div>
              <Upload {...uploadProps} disabled={isLoading}>
                <Button icon={<UploadOutlined />} disabled={isLoading}>
                  Загрузить фото (необязательно)
                </Button>
              </Upload>
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Максимальный размер: 2MB
              </Text>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              icon={isLoading ? <Spin size="small" /> : null}
            >
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </Space>
        </form>
      </Space>
    </div>
  );
}
