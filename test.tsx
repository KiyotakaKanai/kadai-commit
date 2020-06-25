import React, { FC, useState, useEffect, useRef } from 'react'
import { useAlert } from 'react-alert'
import { Helmet } from 'react-helmet'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../store'
import { fetchMemberList } from '../../../containers/member/listSlice'
import {
  destroyMember,
  passwordReset,
} from '../../../containers/member/memberSlice'
import { resetFormErors } from '../../../containers/common/errorsSlice'
import { Member } from '../../../models/member'
import { format } from '../../../utils/date'
import { setJqueryDataTable } from '../../../utils/dataTables'
import Modal from '../../../components/atoms/Modal'
import MemberModalForm from './MemberModalForm'
import Loading from '../../../components/atoms/Loading'
import { useTranslation } from 'react-i18next'
import "../../../assets/scss/components/intro.scss";
//@ts-ignore
import { Steps } from 'intro.js-react'
import ImportMultiMembersModal from './ImportMultiMembersModal'
import { forEach } from 'lodash'
import '../../../assets/scss/components/import_members.scss'

interface MemberEditModal {
  show: boolean
  targetMemberData: Member | null
}

interface MemberModal {
  show: boolean
  mode: 'delete' | 'passwordReset'
  title: string
  targetMemberData: Member | null
}

interface ImportMembersModal {
  show: boolean
  title: string
}

interface CsvErrorMessage {
  line: string
  message: string[]
}

const MemberList: FC = () => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const alert = useAlert()

  const FORMAT_DATETIME = t('time.date.formats.with_time')

  const memberTableRef = useRef<HTMLTableElement>(null)

  const [introShow, setIntroShow] = useState(false)

  const [memberNewEditModal, setMemberNewEditModal] = useState<MemberEditModal>({
    show: false,
    targetMemberData: null
  })

  const [memberModal, setMemberModal] = useState<MemberModal>({
    show: false,
    mode: 'delete',
    title: '',
    targetMemberData: null
  })

  const [ImportMembersModal, setImportMembersModal] = useState<ImportMembersModal>({
    show: false,
    title: ''
  })

  const {
    commonPart,
    member,
    memberList,
  } = useSelector((state: RootState) => (state))

  const stepsVal = [
    {
      element: ".add_member_button",
      intro: t('setting.member.navigation_message')
    },
    {
      element: ".second",
      intro: "second"
    }
  ]

  const introOptions = {
    showStepNumbers: false,
    showBullets: false,
    exitOnOverlayClick: false,
    showButtons: false
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const result = urlParams.get('finish_intro')
    if (!result) return
    setIntroShow(true)
  }, [])

  useEffect(() => {
    if (!commonPart.company?.id) return
    dispatch(
      fetchMemberList(
        { company_id: commonPart.company.id },
        () => setJqueryDataTable(memberTableRef)
      )
    )
  }, [commonPart])

  const handleMemberDelete = (memberName: string) => {
    if (!memberModal.targetMemberData) return
    dispatch(
      destroyMember(
        memberModal.targetMemberData.id,
        () => {
          alert.success(t('setting.member.alert.delete_member', { name: memberName }))
          handleCloseMemberModal()
        }
      )
    )
  }

  const handleMemberPasswordReset = (memberName: string) => {
    if (!memberModal.targetMemberData) return
    dispatch(
      passwordReset(
        memberModal.targetMemberData.id,
        () => {
          alert.success(t('setting.member.alert.reset_password', { name: memberName }))
          handleCloseMemberModal()
        }
      )
    )
  }

  const handleCloseMemberNewEditModal = () => {
    dispatch(resetFormErors())
    setMemberNewEditModal({
      targetMemberData: null,
      show: false,
    })
  }

  const handleCloseMemberModal = () => {
    setMemberModal({
      ...memberModal,
      targetMemberData: null,
      show: false,
    })
  }

  const handleOpenAddMemberModal = () => {
    setIntroShow(false)
    setMemberNewEditModal({
      ...memberNewEditModal,
      show: true,
    })
  }

  const handleExitIntro = () => {
    setIntroShow(false)
  }

  const handleOpenImportMembersModal = () => {
    if (memberList.leftCount <= 0) {
      alert.error(t('setting.member.over_limit_count'))
    } else {
      setImportMembersModal({
        show: true,
        title: t('setting.member_modal.new_multi_members.title')
      })
    }
  }

  const handleCloseImportMembersModal = () => {
    setImportMembersModal({
      show: false,
      title: ''
    })
  }

  const handleOpenEditMemberModal = (member: Member) => {
    setMemberNewEditModal({
      show: true,
      targetMemberData: member,
    })
  }

  const handleOpenDeleteMemberModal = (member: Member) => {
    setMemberModal({
      show: true,
      mode: 'delete',
      title: t('setting.member_modal.confirm_delete_member.title'),
      targetMemberData: member,
    })
  }

  const handleOpenPasswordResetModal = (member: Member) => {
    setMemberModal({
      show: true,
      mode: 'passwordReset',
      title: t('setting.member_modal.confirm_reset_password.title'),
      targetMemberData: member,
    })
  }

  const renderDelete = () => {
    const { targetMemberData } = memberModal
    if (!targetMemberData) return
    return (
      <>
        <div className="modal-body">
          <p>
            {t('setting.member_modal.confirm_delete_member.member_header')} <span id="delete-member-name">{targetMemberData.name}</span>
          </p>
          <p>{t('setting.member_modal.confirm_delete_member.confirm')}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default pull-left" data-dismiss="modal">
            {t('form.component.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            onClick={handleMemberDelete.bind(this, targetMemberData.name)}
            disabled={member.isLoading}
          >
            {t('form.component.delete')}
          </button>
        </div>
      </>
    )
  }

  const renderPasswordReset = () => {
    return (
      <>
        <div className="modal-body">
          <p>
            {t('setting.member_modal.confirm_reset_password.member_header')} <span id="delete-member-name">{memberModal.targetMemberData?.name}</span>
          </p>
          <p>{t('setting.member_modal.confirm_reset_password.confirm')}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default pull-left" data-dismiss="modal">
            {t('form.component.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            onClick={handleMemberPasswordReset.bind(this, memberModal.targetMemberData?.name)}
            disabled={member.isLoading}
          >
            {t('form.component.send')}
          </button>
        </div>
      </>
    )
  }

  const renderCsvImportErrors = () => {
    const errorMessages: CsvErrorMessage[] = []
    forEach(member.csvErrors, (value, key) => {
      errorMessages.push({
        line: key,
        message: value
      })
    })

    return (
      <div className="error-messages">
        {
          errorMessages.map((error: CsvErrorMessage, index: number) => (
            <p key={index}>
              {t('layouts.csv_error_results.row_number', { row: error.line })}： {error.message.map((val: string) => (
                t(`setting.member.${val}`)
              ))}
            </p>
          ))
        }
      </div>
    )
  }

  // TODO(Issue6): 登録後処理

  return (
    <>
      <Helmet>
        <title>Qasee - setting</title>
      </Helmet>
      <div className="content-wrapper">
        <section className="content-header">
          <h1>{t('setting.member.title')}</h1>
        </section>

        <section className="content">
          <div className="row">
            <div className="col-xs-12">
              <div className="box">
                <div className="add-member">
                  {
                    // TODO(Issue6): エラーメッセージ表示があれば表示
                    false && (
                      <p className="form-error">エラーメッセージ</p>
                    )
                  }
                  <button
                    type="button"
                    className="btn btn-warning add_member_button"
                    data-toggle="modal"
                    data-target="#modal-add-member"
                    onClick={handleOpenAddMemberModal}
                  >
                    {t('setting.member.add_member')}
                  </button>&nbsp;
                <button
                    type="button"
                    className="btn btn-warning"
                    data-toggle="modal"
                    onClick={handleOpenImportMembersModal}
                  >
                    {t('setting.member.add_multi_members_button')}
                  </button>
                  <Steps
                    enabled={introShow}
                    steps={stepsVal}
                    initialStep={0}
                    onExit={handleExitIntro}
                    options={introOptions}
                  />
                  {Object.keys(member.csvErrors).length > 0 && renderCsvImportErrors()}
                </div>
                <div className="box-header">
                  <h3 className="box-title">{t('setting.member.caption')}</h3>
                </div>
                <div className="box-body member-setting">
                  {
                    memberList.isLoading || !memberList.members ? (
                      <Loading />
                    ) : (
                        <table
                          ref={memberTableRef}
                          className="table table-bordered table-hover"
                        >
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>{t('model.member.name')}</th>
                              <th>{t('model.member_detail.contract')}</th>
                              <th>{t('model.member_detail.place')}</th>
                              <th>{t('model.member.email')}</th>
                              <th>{t('model.member.created_at')}</th>
                              <th style={{ width: '140px' }} />
                            </tr>
                          </thead>
                          <tbody>
                            {
                              memberList.members.map((member: Member, index: number) => (
                                <tr key={member.custom_id}>
                                  <td>{member.custom_id}</td>
                                  <td>{member.name}</td>
                                  <td>{member.contract}</td>
                                  <td>{member.place}</td>
                                  <td>{member.email}</td>
                                  <td>
                                    {
                                      format(
                                        member.priority_created_at ? member.priority_created_at : member.created_at,
                                        FORMAT_DATETIME
                                      )
                                    }
                                  </td>
                                  <td className="btn-cell">
                                    <div className="btn-group">
                                      <button
                                        type="button"
                                        className="btn btn-info modify-member"
                                        data-toggle="modal"
                                        onClick={handleOpenEditMemberModal.bind(this, member)}
                                      >
                                        {t('form.component.modify')}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-info dropdown-toggle"
                                        data-toggle="dropdown"
                                      >
                                        <span className="caret" />
                                        <span className="sr-only">Toggle Dropdown</span>
                                      </button>
                                      <ul className="dropdown-menu" role="menu">
                                        <li className="dropdown-item">
                                          <a
                                            className="modify-member"
                                            data-toggle="modal"
                                            data-target="#modal-modify-member"
                                            onClick={handleOpenEditMemberModal.bind(this, member)}
                                          >
                                            {t('form.component.modify')}
                                          </a>
                                        </li>
                                        <li className="dropdown-item">
                                          <a
                                            className="reset-password"
                                            data-toggle="modal"
                                            data-target="#modal-reset-password"
                                            onClick={handleOpenPasswordResetModal.bind(this, member)}
                                          >
                                            {t('setting.member.table.reset_password')}
                                          </a>
                                        </li>
                                        <li className="dropdown-item">
                                          <a
                                            className="delete-member"
                                            data-toggle="modal"
                                            data-target="#modal-delete-member"
                                            onClick={handleOpenDeleteMemberModal.bind(this, member)}
                                          >
                                            {t('form.component.delete')}
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      )
                  }
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Modal
        title={memberNewEditModal.targetMemberData ? t('setting.member_modal.modify_member.title') : t('setting.member_modal.new_member.title')}
        show={memberNewEditModal.show}
        hideCallback={handleCloseMemberNewEditModal}
      >
        <MemberModalForm
          targetMembertData={memberNewEditModal.targetMemberData}
          handleCloseModal={handleCloseMemberNewEditModal}
        />
      </Modal>

      <Modal
        title={memberModal.title}
        show={memberModal.show}
        hideCallback={handleCloseMemberModal}
      >
        {memberModal.mode === 'delete' ? renderDelete() : renderPasswordReset()}
      </Modal>
      <ImportMultiMembersModal
        show={ImportMembersModal.show}
        title={ImportMembersModal.title}
        count={memberList.leftCount}
        closeModal={handleCloseImportMembersModal} />
    </>
  )
}

export default MemberList
