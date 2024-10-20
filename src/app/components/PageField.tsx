import { ReactNode } from 'react';
import {
  MdAttachMoney,
  MdEvent,
  MdOutlineDescription,
  MdOutlineGroups,
  MdOutlineLocationOn,
  MdOutlinePerson,
  MdOutlineTimer,
  MdSchedule,
} from 'react-icons/md';

const icons = {
  attach_money: MdAttachMoney,
  description: MdOutlineDescription,
  event: MdEvent,
  groups: MdOutlineGroups,
  location_on: MdOutlineLocationOn,
  person: MdOutlinePerson,
  schedule: MdSchedule,
  timer: MdOutlineTimer
};

type PageFieldProps = {
  children: ReactNode;
  iconName: keyof typeof icons;
};

export default function PageField({
  children,
  iconName
}: PageFieldProps) {
  const Icon = icons[iconName];

  return (
    <p className="flex items-center py-1 gap-2 border-b border-primary">
      <Icon className="h-6 w-6 m-2" />
      <span className="flex gap-1 font-display font-medium text-[0.8125rem] leading-[1.2188rem] tracking-[0.0094rem] md:text-lg text-primary">
        {children}
      </span>
    </p>
  );
}
