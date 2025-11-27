import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  Bars3BottomLeftIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface NavbarProps {
  onMenuClick: () => void;
  onDesktopMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Navbar = ({
  onMenuClick,
  onDesktopMenuClick,
  isSidebarOpen,
}: NavbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Menu Buttons */}
        <div className="flex items-center space-x-2">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Desktop Menu Button */}
          <button
            onClick={onDesktopMenuClick}
            className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bars3BottomLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Page Title (optional) */}
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Welcome back, {user?.fullName}
            </h1>
          </div>
        </div>

        {/* User Menu */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full">
              <UserCircleIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        "flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300",
                        active ? "bg-gray-100 dark:bg-gray-700" : ""
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};
