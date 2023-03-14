import { StatusLabel } from "@canonical/react-components";
import classNames from "classnames";
import Logo from "components/Logo/Logo";
import UserMenu from "components/UserMenu/UserMenu";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import { getAppVersion } from "store/general/selectors";
import {
  getControllerData,
  getGroupedModelStatusCounts,
} from "store/juju/selectors";
import { Controllers } from "store/juju/types";
import "./_primary-nav.scss";

const ModelsLink = () => {
  const { blocked: blockedModels } = useSelector(getGroupedModelStatusCounts);
  return (
    <NavLink
      className={({ isActive }) =>
        classNames("p-list__link", {
          "is-selected": isActive,
        })
      }
      to={"/models"}
    >
      <i className={`p-icon--models is-light`}></i>
      <span className="hide-collapsed">Models</span>
      {blockedModels > 0 && (
        <span className="entity-count is-negative">{blockedModels}</span>
      )}
    </NavLink>
  );
};

const ControllersLink = () => {
  const controllers: Controllers | null = useSelector(getControllerData);

  const controllersUpdateCount = useMemo(() => {
    if (!controllers) return 0;
    let count = 0;
    Object.values(controllers).forEach((controller) => {
      controller.forEach((controller) => {
        if ("version" in controller && controller.updateAvailable) {
          count += 1;
        }
      });
    });
    return count;
  }, [controllers]);

  return (
    <NavLink
      className={({ isActive }) =>
        classNames("p-list__link", {
          "is-selected": isActive,
        })
      }
      to={"/controllers"}
    >
      <i className={`p-icon--controllers is-light`}></i>
      <span className="hide-collapsed">Controllers</span>
      {controllersUpdateCount > 0 && (
        <span className="entity-count is-caution">
          {controllersUpdateCount}
        </span>
      )}
    </NavLink>
  );
};

const PrimaryNav = () => {
  const appVersion = useSelector(getAppVersion);
  return (
    <nav className="p-primary-nav">
      <div className="p-primary-nav__header">
        <Logo />
      </div>

      <ul className="p-list is-internal">
        <li className="p-list__item">
          <ModelsLink />
        </li>
        <li className="p-list__item">
          <ControllersLink />
        </li>
      </ul>
      <hr className="p-primary-nav__divider hide-collapsed" />
      <div className="p-primary-nav__bottom hide-collapsed">
        <ul className="p-list">
          <li className="p-list__item">
            <a
              className="p-list__link"
              href="https://github.com/canonical-web-and-design/jaas-dashboard/issues/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report a bug
            </a>
          </li>
        </ul>
      </div>
      <hr className="p-primary-nav__divider hide-collapsed" />
      <div className="p-primary-nav__bottom hide-collapsed">
        <ul className="p-list">
          <li className="p-list__item">
            <span className="version">Version {appVersion}</span>
            <StatusLabel appearance="positive">Beta</StatusLabel>
          </li>
        </ul>
      </div>
      <UserMenu />
    </nav>
  );
};

export default PrimaryNav;
