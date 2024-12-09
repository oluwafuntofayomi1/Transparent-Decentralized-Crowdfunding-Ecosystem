;; project-management contract

(define-map projects
  { project-id: uint }
  {
    creator: principal,
    title: (string-ascii 100),
    description: (string-utf8 1000),
    funding-goal: uint,
    current-funds: uint,
    deadline: uint,
    status: (string-ascii 20)
  }
)

(define-map project-backers
  { project-id: uint, backer: principal }
  { amount: uint }
)

(define-data-var next-project-id uint u0)

(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-PROJECT-EXISTS u402)
(define-constant ERR-INVALID-PROJECT u403)
(define-constant ERR-DEADLINE-PASSED u404)
(define-constant ERR-ALREADY-BACKED u405)

(define-public (create-project (title (string-ascii 100)) (description (string-utf8 1000)) (funding-goal uint) (deadline uint))
  (let
    (
      (project-id (var-get next-project-id))
    )
    (asserts! (> deadline block-height) (err ERR-DEADLINE-PASSED))
    (map-set projects
      { project-id: project-id }
      {
        creator: tx-sender,
        title: title,
        description: description,
        funding-goal: funding-goal,
        current-funds: u0,
        deadline: deadline,
        status: "active"
      }
    )
    (var-set next-project-id (+ project-id u1))
    (ok project-id)
  )
)

(define-public (back-project (project-id uint) (amount uint))
  (let
    (
      (project (unwrap! (map-get? projects { project-id: project-id }) (err ERR-INVALID-PROJECT)))
      (current-backing (default-to { amount: u0 } (map-get? project-backers { project-id: project-id, backer: tx-sender })))
    )
    (asserts! (< block-height (get deadline project)) (err ERR-DEADLINE-PASSED))
    (asserts! (is-eq (get status project) "active") (err ERR-INVALID-PROJECT))
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    (map-set projects
      { project-id: project-id }
      (merge project { current-funds: (+ (get current-funds project) amount) })
    )
    (map-set project-backers
      { project-id: project-id, backer: tx-sender }
      { amount: (+ (get amount current-backing) amount) }
    )
    (ok true)
  )
)

(define-read-only (get-project (project-id uint))
  (map-get? projects { project-id: project-id })
)

(define-read-only (get-backer-contribution (project-id uint) (backer principal))
  (default-to { amount: u0 } (map-get? project-backers { project-id: project-id, backer: backer }))
)

(define-public (finalize-project (project-id uint))
  (let
    (
      (project (unwrap! (map-get? projects { project-id: project-id }) (err ERR-INVALID-PROJECT)))
    )
    (asserts! (is-eq tx-sender (get creator project)) (err ERR-UNAUTHORIZED))
    (asserts! (>= block-height (get deadline project)) (err ERR-DEADLINE-PASSED))
    (if (>= (get current-funds project) (get funding-goal project))
      (map-set projects
        { project-id: project-id }
        (merge project { status: "funded" })
      )
      (map-set projects
        { project-id: project-id }
        (merge project { status: "failed" })
      )
    )
    (ok true)
  )
)

